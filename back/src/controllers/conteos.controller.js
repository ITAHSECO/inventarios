const conteosService = require('../services/conteos.service');
const { success, created, paginated, noContent } = require('../utils/apiResponse');

class ConteosController {
  async list(req, res, next) {
    try {
      const result = await conteosService.list(req.validated.query);
      return paginated(res, { ...result, page: req.validated.query.page, limit: req.validated.query.limit });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const conteo = await conteosService.getById(req.validated.params.id);
      return success(res, conteo);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const conteo = await conteosService.create(req.validated.body, req.user.id);
      return created(res, conteo);
    } catch (error) {
      next(error);
    }
  }

  async bulkCreate(req, res, next) {
    try {
      const result = await conteosService.bulkCreate(req.validated.body.capturas, req.user.id);
      return created(res, result);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const conteo = await conteosService.update(req.validated.params.id, req.validated.body);
      return success(res, conteo);
    } catch (error) {
      next(error);
    }
  }

  async supervisorEdit(req, res, next) {
    try {
      const conteo = await conteosService.supervisorEdit(
        req.validated.params.id,
        req.validated.body,
        req.user.id
      );
      return success(res, conteo);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await conteosService.delete(req.validated.params.id);
      return noContent(res);
    } catch (error) {
      next(error);
    }
  }

  async getMisConteos(req, res, next) {
    try {
      const { page = 1, limit = 25 } = req.query;
      const result = await conteosService.getMisConteos(req.user.id, {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      });
      return paginated(res, { ...result, page: parseInt(page, 10), limit: parseInt(limit, 10) });
    } catch (error) {
      next(error);
    }
  }

  async export(req, res, next) {
    try {
      const data = await conteosService.exportCsv(req.validated.query);
      const csv = toCsv(data);
      const label = req.validated.query.barrido_id || req.validated.query.barrido || 'export';
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="capturas_${label}.csv"`);
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }
}

// ------------------------------------------------------------
// Helper: array de objetos a CSV (UTF-8 con BOM para Excel)
// ------------------------------------------------------------
function toCsv(rows) {
  if (!rows || rows.length === 0) return '\uFEFF';
  const cols = [
    'barrido', 'codigo', 'descripcion', 'ubicacion', 'conteo', 'cunidad',
    'almacen', 'marca', 'estado', 'serie_lote', 'vcto_capturado', 'observacion',
    'inventariador_id', 'created_at',
  ];
  const esc = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };
  const BOM = '\uFEFF';
  const header = cols.join(',');
  const body = rows.map((r) => cols.map((c) => esc(r[c])).join(',')).join('\n');
  return BOM + header + '\n' + body + '\n';
}

module.exports = new ConteosController();
