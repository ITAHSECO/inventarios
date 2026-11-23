const configCapturaService = require('../services/configcaptura.service');
const { success } = require('../utils/apiResponse');

class ConfigCapturaController {
  async getAll(req, res, next) {
    try {
      const data = await configCapturaService.getAll();
      return success(res, data);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const data = await configCapturaService.update(req.validated.body.campos, req.user.id);
      return success(res, data);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ConfigCapturaController();
