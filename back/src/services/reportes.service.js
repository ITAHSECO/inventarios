const { supabaseAdmin } = require('../config/supabase');
const ApiError = require('../utils/ApiError');

class ReportesService {
  async resumenDiferencias({ barrido, id_alm, page, limit }) {
    let query = supabaseAdmin
      .from('vw_resumen_diferencias_inventario')
      .select('*', { count: 'exact' });

    if (barrido) query = query.eq('barrido', barrido.toUpperCase().trim());
    if (id_alm) query = query.eq('id_alm', id_alm.toUpperCase().trim());

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query
      .order('barrido')
      .order('codigo')
      .range(from, to);

    if (error) throw ApiError.internal(error.message);
    return { data, total: count };
  }

  async dashboard() {
    const { data: conteos, error: conteosError } = await supabaseAdmin
      .from('captura_inventario_conteos')
      .select('id, conteo, modificado_por_supervisor');

    if (conteosError) throw ApiError.internal(conteosError.message);

    const { data: planillas, error: planillasError } = await supabaseAdmin
      .from('planillasinventario')
      .select('id, existencia, barrido, id_alm');

    if (planillasError) throw ApiError.internal(planillasError.message);

    const totalPlanillas = planillas.length;
    const totalConteos = conteos.length;
    const conteosModificados = conteos.filter((c) => c.modificado_por_supervisor).length;

    const barridos = [...new Set(planillas.map((p) => p.barrido))];
    const almacenes = [...new Set(planillas.map((p) => p.id_alm))];

    const conteosPorBarrido = {};
    barridos.forEach((b) => {
      const planillasBarrido = planillas.filter((p) => p.barrido === b);
      conteosPorBarrido[b] = {
        totalPlanillas: planillasBarrido.length,
        existenciaTotal: planillasBarrido.reduce((sum, p) => sum + parseFloat(p.existencia || 0), 0),
      };
    });

    return {
      totalPlanillas,
      totalConteos,
      conteosModificados,
      totalBarridos: barridos.length,
      totalAlmacenes: almacenes.length,
      barridos,
      almacenes,
      conteosPorBarrido,
      progresoCaptura: totalPlanillas > 0
        ? Math.round((totalConteos / totalPlanillas) * 100)
        : 0,
    };
  }

  async getResumenDiferenciasCompleto(filters) {
    const { data, error } = await supabaseAdmin
      .from('vw_resumen_diferencias_inventario')
      .select('*');

    if (error) throw ApiError.internal(error.message);

    let filtered = data;
    if (filters.barrido) {
      filtered = filtered.filter((r) => r.barrido === filters.barrido.toUpperCase().trim());
    }
    if (filters.id_alm) {
      filtered = filtered.filter((r) => r.id_alm === filters.id_alm.toUpperCase().trim());
    }

    const exacto = filtered.filter((r) => r.estado === 'EXACTO').length;
    const sobrante = filtered.filter((r) => r.estado === 'SOBRANTE').length;
    const faltante = filtered.filter((r) => r.estado === 'FALTANTE').length;

    return {
      resumen: { exacto, sobrante, faltante, total: filtered.length },
      detalles: filtered,
    };
  }
}

module.exports = new ReportesService();
