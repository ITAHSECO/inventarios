const logger = require('../utils/logger');

function errorHandler(err, req, res, _next) {
  logger.error({
    err: {
      message: err.message,
      stack: err.stack,
      statusCode: err.statusCode,
    },
    req: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userId: req.user?.id,
    },
  });

  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        details: err.details || undefined,
      },
    });
  }

  const pgErrorMap = {
    '42501': 'No tiene permisos para realizar esta accion',
    '23505': 'Ya existe un registro con estos datos',
    '23503': 'El recurso referenciado no existe',
    '23502': 'Faltan campos obligatorios',
    'PGRST116': 'Registro no encontrado',
  };

  if (err.code && pgErrorMap[err.code]) {
    return res.status(err.code === '42501' ? 403 : 400).json({
      success: false,
      error: { message: pgErrorMap[err.code] },
    });
  }

  if (err.message && err.message.includes('new row violates row-level security policy')) {
    return res.status(403).json({
      success: false,
      error: { message: 'No tiene permisos para realizar esta accion' },
    });
  }

  res.status(500).json({
    success: false,
    error: { message: 'Error interno del servidor' },
  });
}

module.exports = errorHandler;
