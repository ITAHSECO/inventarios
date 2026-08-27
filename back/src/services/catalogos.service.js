const { supabaseAdmin } = require('../config/supabase');
const ApiError = require('../utils/ApiError');

class CatalogosService {
  async list({ page, limit, id_tabla, activo, search }) {
    let query = supabaseAdmin.from('maestra_parametros').select('*', { count: 'exact' });

    if (id_tabla) query = query.eq('id_tabla', id_tabla.toUpperCase().trim());
    if (activo !== undefined) query = query.eq('activo', activo);
    if (search) {
      query = query.or(`id_elemento.ilike.%${search}%,descripcion.ilike.%${search}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query
      .order('id_tabla')
      .order('id_elemento')
      .range(from, to);

    if (error) throw ApiError.internal(error.message);
    return { data, total: count };
  }

  async getActivos() {
    const { data, error } = await supabaseAdmin
      .from('vw_catalogos_activos')
      .select('*')
      .order('id_tabla')
      .order('id_elemento');

    if (error) throw ApiError.internal(error.message);
    return data;
  }

  async getTablas() {
    const { data, error } = await supabaseAdmin
      .from('maestra_parametros')
      .select('id_tabla')
      .eq('activo', true);

    if (error) throw ApiError.internal(error.message);

    const tablas = [...new Set(data.map((r) => r.id_tabla))].sort();
    return tablas;
  }

  async getById(id) {
    const { data, error } = await supabaseAdmin
      .from('maestra_parametros')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw ApiError.notFound('Catalogo no encontrado');
    return data;
  }

  async create({ id_tabla, id_elemento, descripcion, activo, creado_por }) {
    const { data, error } = await supabaseAdmin
      .from('maestra_parametros')
      .insert({
        id_tabla: id_tabla.toUpperCase().trim(),
        id_elemento: id_elemento.toUpperCase().trim(),
        descripcion,
        activo: activo !== undefined ? activo : true,
        creado_por: creado_por || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw ApiError.conflict('Ya existe un catalogo con este id_tabla e id_elemento');
      }
      throw ApiError.internal(error.message);
    }
    return data;
  }

  async update(id, updates) {
    const allowed = {};
    if (updates.descripcion !== undefined) allowed.descripcion = updates.descripcion;
    if (updates.activo !== undefined) allowed.activo = updates.activo;
    allowed.fecha_modificacion = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('maestra_parametros')
      .update(allowed)
      .eq('id', id)
      .select()
      .single();

    if (error) throw ApiError.internal(error.message);
    if (!data) throw ApiError.notFound('Catalogo no encontrado');
    return data;
  }
}

module.exports = new CatalogosService();
