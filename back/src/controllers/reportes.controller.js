const reportesService = require('../services/reportes.service');
const { success, paginated } = require('../utils/apiResponse');

class ReportesController {
  async resumenDiferencias(req, res, next) {
    try {
      const { barrido, id_alm, page = 1, limit = 25 } = req.query;
      const result = await reportesService.resumenDiferencias({
        barrido,
        id_alm,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      });
      return paginated(res, { ...result, page: parseInt(page, 10), limit: parseInt(limit, 10) });
    } catch (error) {
      next(error);
    }
  }

  async resumenDiferenciasCompleto(req, res, next) {
    try {
      const result = await reportesService.getResumenDiferenciasCompleto(req.query);
      return success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async dashboard(req, res, next) {
    try {
      const data = await reportesService.dashboard();
      return success(res, data);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReportesController();
