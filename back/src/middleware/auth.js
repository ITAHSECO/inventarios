const { supabaseAdmin } = require('../config/supabase');
const { supabaseAnon } = require('../config/supabase');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Token de acceso requerido');
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      logger.warn({ error: error?.message }, '[Auth] Invalid token');
      throw ApiError.unauthorized('Token de acceso invalido o expirado');
    }

    const { data: perfil, error: perfilError } = await supabaseAdmin
      .from('perfiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (perfilError || !perfil) {
      throw ApiError.unauthorized('Perfil de usuario no encontrado');
    }

    if (!perfil.activo) {
      throw ApiError.forbidden('Usuario desactivado');
    }

    req.user = {
      id: user.id,
      email: user.email,
      username: perfil.username,
      nombres: perfil.nombres,
      apellidos: perfil.apellidos,
      rol: perfil.rol,
      token,
    };

    logger.debug({ userId: user.id, username: perfil.username, rol: perfil.rol }, '[Auth] User authenticated');
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

module.exports = authenticateToken;
