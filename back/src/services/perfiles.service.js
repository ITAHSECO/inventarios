const { supabaseAdmin } = require('../config/supabase');
const ApiError = require('../utils/ApiError');

class PerfilesService {
  async list({ page, limit, rol, activo, search, sort, order }) {
    let query = supabaseAdmin.from('perfiles').select('*', { count: 'exact' });

    if (rol) query = query.eq('rol', rol);
    if (activo !== undefined) query = query.eq('activo', activo);
    if (search) {
      query = query.or(`username.ilike.%${search}%,nombres.ilike.%${search}%,apellidos.ilike.%${search}%`);
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
    const { data, error } = await supabaseAdmin
      .from('perfiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw ApiError.notFound('Perfil no encontrado');
    return data;
  }

  async create({ username, nombres, apellidos, rol, pin_autorizacion, activo }) {
    const { data: existing } = await supabaseAdmin
      .from('perfiles')
      .select('id')
      .eq('username', username)
      .single();

    if (existing) throw ApiError.conflict('El username ya existe');

    const { data, error } = await supabaseAdmin
      .from('perfiles')
      .insert({
        id: crypto.randomUUID(),
        username: username.toUpperCase().trim(),
        nombres: nombres.toUpperCase().trim(),
        apellidos: apellidos.toUpperCase().trim(),
        rol,
        pin_autorizacion: pin_autorizacion || null,
        activo: activo !== undefined ? activo : true,
      })
      .select()
      .single();

    if (error) throw ApiError.internal(error.message);
    return data;
  }

  async update(id, updates) {
    const allowed = {};
    if (updates.nombres !== undefined) allowed.nombres = updates.nombres.toUpperCase().trim();
    if (updates.apellidos !== undefined) allowed.apellidos = updates.apellidos.toUpperCase().trim();
    if (updates.rol !== undefined) allowed.rol = updates.rol;
    if (updates.activo !== undefined) allowed.activo = updates.activo;
    allowed.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('perfiles')
      .update(allowed)
      .eq('id', id)
      .select()
      .single();

    if (error) throw ApiError.internal(error.message);
    if (!data) throw ApiError.notFound('Perfil no encontrado');
    return data;
  }

  async setPin(id, pin) {
    const { error } = await supabaseAdmin.rpc('fn_establecer_pin_supervisor', {
      p_usuario_id: id,
      p_nuevo_pin: pin,
    });

    if (error) throw ApiError.internal('Error al establecer PIN');
  }

  async validatePin(username, pin) {
    const { data, error } = await supabaseAdmin.rpc('fn_validar_pin_supervisor', {
      p_username: username,
      p_pin_ingresado: pin,
    });

    if (error) throw ApiError.internal('Error al validar PIN');
    return data;
  }

  async delete(id) {
    const { data: existing } = await supabaseAdmin
      .from('perfiles')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) throw ApiError.notFound('Perfil no encontrado');

    await supabaseAdmin.from('barrido_usuarios').delete().eq('usuario_id', id);

    await supabaseAdmin.from('captura_inventario_conteos').update({ inventariador_id: null }).eq('inventariador_id', id);
    await supabaseAdmin.from('captura_inventario_conteos').update({ supervisor_id: null }).eq('supervisor_id', id);

    await supabaseAdmin.from('barridos').update({ creado_por: null }).eq('creado_por', id);
    await supabaseAdmin.from('planillasinventario').update({ creado_por: null }).eq('creado_por', id);
    await supabaseAdmin.from('maestra_parametros').update({ creado_por: null }).eq('creado_por', id);
    await supabaseAdmin.from('barrido_usuarios').update({ asignado_por: null }).eq('asignado_por', id);

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (authError) throw ApiError.internal('Error al eliminar usuario de auth: ' + authError.message);

    const { error } = await supabaseAdmin
      .from('perfiles')
      .delete()
      .eq('id', id);

    if (error) throw ApiError.internal('Error al eliminar perfil: ' + error.message);
  }
}

module.exports = new PerfilesService();
