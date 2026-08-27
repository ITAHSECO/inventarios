const ApiError = require('../utils/ApiError');

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.rol) {
      return res.status(403).json({
        success: false,
        error: { message: 'No autenticado' },
      });
    }

    if (!allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'No tiene permisos para realizar esta accion',
          required: allowedRoles,
          current: req.user.rol,
        },
      });
    }

    next();
  };
}

module.exports = requireRole;
