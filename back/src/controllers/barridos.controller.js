const barridosService = require('../services/barridos.service');
const { success, created, paginated } = require('../utils/apiResponse');

class BarridosController {
  async list(req, res, next) {
    try {
      const result = await barridosService.list(req.validated.query);
      return paginated(res, { ...result, page: req.validated.query.page, limit: req.validated.query.limit });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const barrido = await barridosService.getById(req.validated.params.id);
      return success(res, barrido);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const barrido = await barridosService.create({
        ...req.validated.body,
        creado_por: req.user.id,
      });
      return created(res, barrido);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const barrido = await barridosService.update(req.validated.params.id, req.validated.body);
      return success(res, barrido);
    } catch (error) {
      next(error);
    }
  }

  async getUsuarios(req, res, next) {
    try {
      const usuarios = await barridosService.getUsuarios(req.validated.params.id);
      return success(res, usuarios);
    } catch (error) {
      next(error);
    }
  }

  async asignarUsuarios(req, res, next) {
    try {
      const result = await barridosService.asignarUsuarios(
        req.validated.params.id,
        req.validated.body.usuario_ids,
        req.user.id
      );
      return created(res, result);
    } catch (error) {
      next(error);
    }
  }

  async desasignarUsuario(req, res, next) {
    try {
      await barridosService.desasignarUsuario(req.validated.params.id, req.validated.params.uid);
      return success(res, { message: 'Usuario desasignado exitosamente' });
    } catch (error) {
      next(error);
    }
  }

  async getMisBarridos(req, res, next) {
    try {
      const barridos = await barridosService.getMisBarridos(req.user.id);
      return success(res, barridos);
    } catch (error) {
      next(error);
    }
  }

  async getInventariadores(req, res, next) {
    try {
      const inventariadores = await barridosService.getInventariadores();
      return success(res, inventariadores);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BarridosController();
