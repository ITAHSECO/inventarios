const { supabaseAdmin } = require('../config/supabase');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

class PlanillasService {
  async list({ page, limit, barrido, id_alm, search }) {
    let query = supabaseAdmin.from('planillasInventario').select('*', { count: 'exact' });

    if (barrido) query = query.eq('barrido', barrido.toUpperCase().trim());
    if (id_alm) query = query.eq('id_alm', id_alm.toUpperCase().trim());
    if (search) {
      query = query.or(`codigo.ilike.%${search}%,articulo.ilike.%${search}%,cod_fab.ilike.%${search}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query
      .order('barrido')
      .order('codigo')
      .range(from, to);

    if (error) throw ApiError.internal(error.message);
    return { data, total: count };
  }

  async getById(id) {
    const { data, error } = await supabaseAdmin
      .from('planillasInventario')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw ApiError.notFound('Planilla no encontrada');
    return data;
  }

  async create(planilla) {
    const { data, error } = await supabaseAdmin
      .from('planillasInventario')
      .insert(planilla)
      .select()
      .single();

    if (error) throw ApiError.internal(error.message);
    return data;
  }

  async bulkCreate(barrido, planillas) {
    logger.info({ barrido, count: planillas.length }, '[PlanillasService] Bulk create');
    const rows = planillas.map(p => ({
      barrido: barrido.toUpperCase().trim(),
      id_alm: p.id_alm ? p.id_alm.toUpperCase().trim() : null,
      id_marca: p.id_marca ? p.id_marca.toUpperCase().trim() : null,
      id_categoria: p.id_categoria ? p.id_categoria.toUpperCase().trim() : null,
      codigo: p.codigo ? p.codigo.toUpperCase().trim() : null,
      cod_fab: p.cod_fab || null,
      existencia: p.existencia || 0,
      articulo: p.articulo || null,
      cunidad: p.cunidad || null,
      serie_lote: p.serie_lote || '-',
      vcto: p.vcto || null,
      maneja_serie_lote: p.maneja_serie_lote || false,
    }));

    const { data, error } = await supabaseAdmin
      .from('planillasInventario')
      .insert(rows)
      .select();

    if (error) throw ApiError.internal(error.message);
    logger.info({ inserted: data.length }, '[PlanillasService] Bulk create completed');
    return { inserted: data.length, data };
  }

  async update(id, updates) {
    const { data, error } = await supabaseAdmin
      .from('planillasInventario')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw ApiError.internal(error.message);
    if (!data) throw ApiError.notFound('Planilla no encontrada');
    return data;
  }

  async delete(id) {
    const { error } = await supabaseAdmin
      .from('planillasInventario')
      .delete()
      .eq('id', id);

    if (error) throw ApiError.internal(error.message);
  }

  async getBarridos() {
    const { data, error } = await supabaseAdmin
      .from('planillasInventario')
      .select('barrido')
      .not('barrido', 'is', null);

    if (error) throw ApiError.internal(error.message);
    const barridos = [...new Set(data.map((r) => r.barrido))].sort();
    return barridos;
  }

  async getAlmacenes() {
    const { data, error } = await supabaseAdmin
      .from('planillasInventario')
      .select('id_alm')
      .not('id_alm', 'is', null);

    if (error) throw ApiError.internal(error.message);
    const almacenes = [...new Set(data.map((r) => r.id_alm))].sort();
    return almacenes;
  }

  async getConteosByPlanilla(planillaId) {
    const { data, error } = await supabaseAdmin
      .from('captura_inventario_conteos')
      .select('*')
      .eq('planilla_id', planillaId)
      .order('created_at', { ascending: false });

    if (error) throw ApiError.internal(error.message);
    return data;
  }
}

module.exports = new PlanillasService();
