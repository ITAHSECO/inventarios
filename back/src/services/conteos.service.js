const { supabaseAdmin } = require('../config/supabase');
const ApiError = require('../utils/ApiError');

class ConteosService {
  async list({ page, limit, barrido, codigo, inventariador_id, planilla_id, search }) {
    let query = supabaseAdmin.from('captura_inventario_conteos').select('*', { count: 'exact' });

    if (barrido) query = query.eq('barrido', barrido.toUpperCase().trim());
    if (codigo) query = query.eq('codigo', codigo.toUpperCase().trim());
    if (inventariador_id) query = query.eq('inventariador_id', inventariador_id);
    if (planilla_id) query = query.eq('planilla_id', planilla_id);
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
    const planilla = await this._getPlanilla(conteo.planilla_id);

    if (planilla.maneja_serie_lote) {
      if (!conteo.serie_lote || conteo.serie_lote === '-' || conteo.serie_lote.trim() === '') {
        throw ApiError.badRequest(
          'El articulo maneja serie/lote y requiere un valor valido (no vacio ni "-")'
        );
      }
    }

    const { data, error } = await supabaseAdmin
      .from('captura_inventario_conteos')
      .insert({
        planilla_id: conteo.planilla_id,
        barrido: planilla.barrido,
        codigo: planilla.codigo,
        ubicacion: conteo.ubicacion,
        conteo: conteo.conteo,
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
        const planilla = await this._getPlanilla(captura.planilla_id);

        if (planilla.maneja_serie_lote) {
          if (!captura.serie_lote || captura.serie_lote === '-' || captura.serie_lote.trim() === '') {
            results.errors.push({
              planilla_id: captura.planilla_id,
              error: 'Serie/lote requerido',
            });
            results.skipped++;
            continue;
          }
        }

        const { error } = await supabaseAdmin
          .from('captura_inventario_conteos')
          .insert({
            planilla_id: captura.planilla_id,
            barrido: planilla.barrido,
            codigo: planilla.codigo,
            ubicacion: captura.ubicacion,
            conteo: captura.conteo,
            serie_lote: captura.serie_lote || '-',
            vcto_capturado: captura.vcto_capturado || null,
            observacion: captura.observacion || null,
            inventariador_id: userId,
          });

        if (error) {
          results.errors.push({ planilla_id: captura.planilla_id, error: error.message });
          results.skipped++;
        } else {
          results.inserted++;
        }
      } catch (err) {
        results.errors.push({ planilla_id: captura.planilla_id, error: err.message });
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

  async _getPlanilla(planillaId) {
    const { data, error } = await supabaseAdmin
      .from('planillasInventario')
      .select('*')
      .eq('id', planillaId)
      .single();

    if (error || !data) throw ApiError.notFound('Planilla no encontrada');
    return data;
  }
}

module.exports = new ConteosService();
