const planillasService = require('../services/planillas.service');
const { success, created, paginated, noContent } = require('../utils/apiResponse');

class PlanillasController {
  async list(req, res, next) {
    try {
      const result = await planillasService.list(req.validated.query);
      return paginated(res, { ...result, page: req.validated.query.page, limit: req.validated.query.limit });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const planilla = await planillasService.getById(req.validated.params.id);
      return success(res, planilla);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const planilla = await planillasService.create(req.validated.body);
      return created(res, planilla);
    } catch (error) {
      next(error);
    }
  }

  async bulkCreate(req, res, next) {
    try {
      const result = await planillasService.bulkCreate(req.body.planillas || req.body);
      return created(res, result);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const planilla = await planillasService.update(req.validated.params.id, req.validated.body);
      return success(res, planilla);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await planillasService.delete(req.validated.params.id);
      return noContent(res);
    } catch (error) {
      next(error);
    }
  }

  async getBarridos(req, res, next) {
    try {
      const barridos = await planillasService.getBarridos();
      return success(res, barridos);
    } catch (error) {
      next(error);
    }
  }

  async getAlmacenes(req, res, next) {
    try {
      const almacenes = await planillasService.getAlmacenes();
      return success(res, almacenes);
    } catch (error) {
      next(error);
    }
  }

  async getConteosByPlanilla(req, res, next) {
    try {
      const conteos = await planillasService.getConteosByPlanilla(req.validated.params.id);
      return success(res, conteos);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PlanillasController();
