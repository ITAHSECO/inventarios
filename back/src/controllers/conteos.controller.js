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
}

module.exports = new ConteosController();
