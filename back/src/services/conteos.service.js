const { supabaseAdmin } = require('../config/supabase');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

class ConteosService {
  async list({ page, limit, barrido, codigo, inventariador_id, search }) {
    let query = supabaseAdmin.from('captura_inventario_conteos').select('*', { count: 'exact' });

    if (barrido) query = query.eq('barrido', barrido.toUpperCase().trim());
    if (codigo) query = query.eq('codigo', codigo.toUpperCase().trim());
    if (inventariador_id) query = query.eq('inventariador_id', inventariador_id);
    if (search) {
      query = query.or(`codigo.ilike.%${search}%,ubicacion.ilike.%${search}%,serie_lote.ilike.%${search}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw ApiError.internal(error.message);
    return { data, total: count };
  }

  async getById(id) {
    const { data, error } = await supabaseAdmin
      .from('captura_inventario_conteos')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw ApiError.notFound('Conteo no encontrado');
    return data;
  }

  async create(conteo, userId) {
    if (!conteo.barrido || !conteo.codigo) {
      throw ApiError.badRequest('Se requiere barrido + codigo');
    }

    const { data, error } = await supabaseAdmin
      .from('captura_inventario_conteos')
      .insert({
        barrido_id: conteo.barrido_id || null,
        barrido: conteo.barrido,
        codigo: conteo.codigo,
        descripcion: conteo.descripcion || null,
        ubicacion: conteo.ubicacion,
        conteo: conteo.conteo,
        cunidad: conteo.cunidad || null,
        serie_lote: conteo.serie_lote || '-',
        vcto_capturado: conteo.vcto_capturado || null,
        observacion: conteo.observacion || null,
        inventariador_id: userId,
      })
      .select()
      .single();

    if (error) throw ApiError.internal(error.message);
    return data;
  }

  async bulkCreate(capturas, userId) {
    const results = { inserted: 0, skipped: 0, errors: [] };

    for (const captura of capturas) {
      try {
        if (!captura.barrido || !captura.codigo) {
          results.errors.push({ error: 'Se requiere barrido + codigo' });
          results.skipped++;
          continue;
        }

        const { error } = await supabaseAdmin
          .from('captura_inventario_conteos')
          .insert({
            barrido_id: captura.barrido_id || null,
            barrido: captura.barrido,
            codigo: captura.codigo,
            descripcion: captura.descripcion || null,
            ubicacion: captura.ubicacion,
            conteo: captura.conteo,
            cunidad: captura.cunidad || null,
            serie_lote: captura.serie_lote || '-',
            vcto_capturado: captura.vcto_capturado || null,
            observacion: captura.observacion || null,
            inventariador_id: userId,
          });

        if (error) {
          results.errors.push({ error: error.message });
          results.skipped++;
        } else {
          results.inserted++;
        }
      } catch (err) {
        results.errors.push({ error: err.message });
        results.skipped++;
      }
    }

    return results;
  }

  async update(id, updates) {
    const existing = await this.getById(id);

    if (existing.modificado_por_supervisor) {
      throw ApiError.forbidden(
        'Este registro fue modificado por un supervisor y no puede ser editado'
      );
    }

    const { data, error } = await supabaseAdmin
      .from('captura_inventario_conteos')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw ApiError.internal(error.message);
    return data;
  }

  async supervisorEdit(id, updates, supervisorId) {
    const { data, error } = await supabaseAdmin
      .from('captura_inventario_conteos')
      .update({
        ...updates,
        modificado_por_supervisor: true,
        supervisor_id: supervisorId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw ApiError.internal(error.message);
    if (!data) throw ApiError.notFound('Conteo no encontrado');
    return data;
  }

  async delete(id) {
    const { error } = await supabaseAdmin
      .from('captura_inventario_conteos')
      .delete()
      .eq('id', id);

    if (error) throw ApiError.internal(error.message);
  }

  async getMisConteos(userId, { page, limit }) {
    let query = supabaseAdmin
      .from('captura_inventario_conteos')
      .select('*', { count: 'exact' })
      .eq('inventariador_id', userId);

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw ApiError.internal(error.message);
    return { data, total: count };
  }
}

module.exports = new ConteosService();
