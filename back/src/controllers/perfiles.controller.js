const perfilesService = require('../services/perfiles.service');
const { success, created, paginated } = require('../utils/apiResponse');

class PerfilesController {
  async list(req, res, next) {
    try {
      const result = await perfilesService.list(req.validated.query);
      return paginated(res, { ...result, page: req.validated.query.page, limit: req.validated.query.limit });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const perfil = await perfilesService.getById(req.validated.params.id);
      return success(res, perfil);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const perfil = await perfilesService.create({ ...req.validated.body, creado_por: req.user.id });
      return created(res, perfil);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const perfil = await perfilesService.update(req.validated.params.id, req.validated.body);
      return success(res, perfil);
    } catch (error) {
      next(error);
    }
  }

  async setPin(req, res, next) {
    try {
      await perfilesService.setPin(req.validated.params.id, req.validated.body.pin);
      return success(res, { message: 'PIN establecido exitosamente' });
    } catch (error) {
      next(error);
    }
  }

  async validatePin(req, res, next) {
    try {
      const valid = await perfilesService.validatePin(
        req.validated.body.username,
        req.validated.body.pin
      );
      return success(res, { valid });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await perfilesService.delete(req.validated.params.id);
      return success(res, { message: 'Usuario eliminado exitosamente' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PerfilesController();
