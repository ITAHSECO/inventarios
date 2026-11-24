const { supabaseAdmin } = require('../config/supabase');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

class BarridosService {
  async list({ page, limit, estado, search, sort, order }) {
    logger.info({ page, limit, estado, search }, '[BarridosService] List');
    let query = supabaseAdmin.from('barridos').select('*', { count: 'exact' });

    if (estado) query = query.eq('estado', estado);
    if (search) {
      query = query.or(`nombre.ilike.%${search}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query
      .order(sort, { ascending: order === 'asc' })
      .range(from, to);

    if (error) throw ApiError.internal(error.message);
    return { data, total: count };
  }

  async getById(id) {
    logger.info({ id }, '[BarridosService] GetById');
    const { data, error } = await supabaseAdmin
      .from('barridos')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw ApiError.notFound('Barrido no encontrado');
    return data;
  }

  async create({ nombre, estado, fecha_inicio, fecha_fin, creado_por }) {
    logger.info({ nombre, estado }, '[BarridosService] Create');
    const { data, error } = await supabaseAdmin
      .from('barridos')
      .insert({
        nombre,
        estado: estado || 'activo',
        fecha_inicio,
        fecha_fin: fecha_fin || null,
        creado_por: creado_por || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') throw ApiError.conflict('Ya existe un barrido con este nombre');
      throw ApiError.internal(error.message);
    }
    return data;
  }

  async update(id, updates) {
    logger.info({ id, updates }, '[BarridosService] Update');
    const allowed = {};
    if (updates.nombre !== undefined) allowed.nombre = updates.nombre;
    if (updates.estado !== undefined) allowed.estado = updates.estado;
    if (updates.fecha_inicio !== undefined) allowed.fecha_inicio = updates.fecha_inicio;
    if (updates.fecha_fin !== undefined) allowed.fecha_fin = updates.fecha_fin;
    allowed.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('barridos')
      .update(allowed)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') throw ApiError.conflict('Ya existe un barrido con este nombre');
      throw ApiError.internal(error.message);
    }
    if (!data) throw ApiError.notFound('Barrido no encontrado');
    return data;
  }

  async getUsuarios(barridoId) {
    logger.info({ barridoId }, '[BarridosService] GetUsuarios');
    const { data, error } = await supabaseAdmin
      .from('barrido_usuarios')
      .select(`
        id,
        created_at,
        usuario_id,
        perfiles:usuario_id (id, username, nombres, apellidos, rol),
        asignado_por_perfiles:asignado_por (username)
      `)
      .eq('barrido_id', barridoId)
      .order('created_at', { ascending: false });

    if (error) throw ApiError.internal(error.message);
    return data;
  }

  async asignarUsuarios(barridoId, usuarioIds, asignadoPor) {
    logger.info({ barridoId, usuarioIds }, '[BarridosService] AsignarUsuarios');
    const registros = usuarioIds.map(uid => ({
      barrido_id: barridoId,
      usuario_id: uid,
      asignado_por: asignadoPor || null,
    }));

    const { data, error } = await supabaseAdmin
      .from('barrido_usuarios')
      .insert(registros)
      .select();

    if (error) {
      if (error.code === '23505') throw ApiError.conflict('Uno o más usuarios ya están asignados a este barrido');
      throw ApiError.internal(error.message);
    }
    return data;
  }

  async desasignarUsuario(barridoId, usuarioId) {
    logger.info({ barridoId, usuarioId }, '[BarridosService] DesasignarUsuario');
    const { error, count } = await supabaseAdmin
      .from('barrido_usuarios')
      .delete()
      .eq('barrido_id', barridoId)
      .eq('usuario_id', usuarioId);

    if (error) throw ApiError.internal(error.message);
    if (count === 0) throw ApiError.notFound('Asignacion no encontrada');
  }

  async delete(id) {
    logger.info({ id }, '[BarridosService] Delete');

    // Verificar que exista (y quedarnos con el nombre para el log)
    const { data: barrido, error: findError } = await supabaseAdmin
      .from('barridos')
      .select('id, nombre')
      .eq('id', id)
      .single();

    if (findError || !barrido) throw ApiError.notFound('Barrido no encontrado');

    // Contar conteos que se eliminaran (para el mensaje de respuesta):
    // los que apuntan por FK y los legacy que solo coinciden por nombre
    const { count: conteosPorFk, error: countError } = await supabaseAdmin
      .from('captura_inventario_conteos')
      .select('*', { count: 'exact', head: true })
      .eq('barrido_id', id);

    if (countError) throw ApiError.internal(countError.message);

    const { count: conteosLegacy, error: legacyCountError } = await supabaseAdmin
      .from('captura_inventario_conteos')
      .select('*', { count: 'exact', head: true })
      .is('barrido_id', null)
      .eq('barrido', barrido.nombre);

    if (legacyCountError) throw ApiError.internal(legacyCountError.message);

    const conteosAsociados = (conteosPorFk || 0) + (conteosLegacy || 0);

    // Conteos legacy sin barrido_id (solo guardan el nombre): la cascada
    // no los alcanza, se eliminan explicitamente por coincidencia de nombre
    const { error: legacyError } = await supabaseAdmin
      .from('captura_inventario_conteos')
      .delete()
      .is('barrido_id', null)
      .eq('barrido', barrido.nombre);

    if (legacyError) throw ApiError.internal(legacyError.message);

    // Eliminar barrido. La FK barrido_id -> ON DELETE CASCADE (auto_009)
    // elimina los conteos; barrido_usuarios ya era CASCADE.
    const { error } = await supabaseAdmin
      .from('barridos')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === '23503') {
        throw ApiError.conflict('No se puede eliminar el barrido: tiene registros asociados');
      }
      throw ApiError.internal(error.message);
    }

    logger.info({ id, nombre: barrido.nombre, conteos_eliminados: conteosAsociados }, '[BarridosService] Deleted');
    return { barrido, conteos_eliminados: conteosAsociados || 0 };
  }

  async getMisBarridos(usuarioId) {
    logger.info({ usuarioId }, '[BarridosService] GetMisBarridos');
    const { data, error } = await supabaseAdmin
      .from('barrido_usuarios')
      .select(`
        barridos:barrido_id (id, nombre, estado, fecha_inicio, fecha_fin)
      `)
      .eq('usuario_id', usuarioId);

    if (error) throw ApiError.internal(error.message);
    return data
      .map(r => r.barridos)
      .filter(b => b && b.estado === 'activo');
  }

  async getInventariadores() {
    logger.info('[BarridosService] GetInventariadores');
    const { data, error } = await supabaseAdmin
      .from('perfiles')
      .select('id, username, nombres, apellidos, activo')
      .eq('rol', 'inventariador')
      .order('nombres');

    if (error) throw ApiError.internal(error.message);
    return data;
  }
}

module.exports = new BarridosService();
