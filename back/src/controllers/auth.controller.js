const authService = require('../services/auth.service');
const { success, created } = require('../utils/apiResponse');

class AuthController {
  async signup(req, res, next) {
    try {
      const result = await authService.signup(req.validated.body);
      return created(res, result);
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const result = await authService.login(req.validated.body);
      return success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      await authService.logout(req.user.token);
      return success(res, { message: 'Sesion cerrada exitosamente' });
    } catch (error) {
      next(error);
    }
  }

  async me(req, res, next) {
    try {
      const perfil = await authService.getMe(req.user.id);
      return success(res, perfil);
    } catch (error) {
      next(error);
    }
  }

  async refresh(req, res, next) {
    try {
      const result = await authService.refreshToken(req.validated.body.refresh_token);
      return success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { current_password, new_password } = req.validated.body;
      await authService.changePassword(req.user.id, current_password, new_password);
      return success(res, { message: 'Contrasena cambiada exitosamente' });
    } catch (error) {
      next(error);
    }
  }

  async bulkSignup(req, res, next) {
    try {
      const result = await authService.bulkSignup(req.validated.body.usuarios);
      return created(res, result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
