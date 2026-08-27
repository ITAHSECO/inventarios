const { supabaseAdmin } = require('../config/supabase');
const ApiError = require('../utils/ApiError');

async function requirePinValidation(req, res, next) {
  try {
    const pin = req.headers['x-supervisor-pin'];
    const username = req.headers['x-supervisor-username'] || req.user.username;

    if (!pin) {
      throw ApiError.forbidden('PIN de supervisor requerido en header X-Supervisor-Pin');
    }

    const { data, error } = await supabaseAdmin.rpc('fn_validar_pin_supervisor', {
      p_username: username,
      p_pin_ingresado: pin,
    });

    if (error) {
      throw ApiError.internal('Error al validar PIN de supervisor');
    }

    if (!data) {
      throw ApiError.forbidden('PIN de supervisor invalido');
    }

    next();
  } catch (error) {
    if (error.isOperational) {
      return res.status(error.statusCode).json({
        success: false,
        error: { message: error.message },
      });
    }
    next(error);
  }
}

module.exports = requirePinValidation;
