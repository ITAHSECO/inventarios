const catalogosService = require('../services/catalogos.service');
const { success, created, paginated } = require('../utils/apiResponse');

class CatalogosController {
  async list(req, res, next) {
    try {
      const result = await catalogosService.list(req.validated.query);
      return paginated(res, { ...result, page: req.validated.query.page, limit: req.validated.query.limit });
    } catch (error) {
      next(error);
    }
  }

  async getActivos(req, res, next) {
    try {
      const data = await catalogosService.getActivos(req.query.id_tabla);
      return success(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getTablas(req, res, next) {
    try {
      const tablas = await catalogosService.getTablas();
      return success(res, tablas);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const catalogo = await catalogosService.getById(req.validated.params.id);
      return success(res, catalogo);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const catalogo = await catalogosService.create({
        ...req.validated.body,
        creado_por: req.user.id,
      });
      return created(res, catalogo);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const catalogo = await catalogosService.update(req.validated.params.id, req.validated.body);
      return success(res, catalogo);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CatalogosController();
