const { supabaseAdmin } = require('../config/supabase');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

class AuthService {
  async signup({ email, password, username, nombres, apellidos, rol }) {
    logger.info({ email, username, rol }, '[AuthService] Signup attempt');

    const { data: existingUser } = await supabaseAdmin
      .from('perfiles')
      .select('id')
      .eq('username', username)
      .single();

    if (existingUser) {
      logger.warn({ username }, '[AuthService] Username already exists');
      throw ApiError.conflict('El username ya esta en uso');
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, nombres, apellidos, rol: rol || 'inventariador' },
    });

    if (error) {
      logger.error({ error: error.message, email }, '[AuthService] createUser failed');
      if (error.message.includes('already')) {
        throw ApiError.conflict('El email ya esta registrado');
      }
      throw ApiError.internal(error.message);
    }

    logger.info({ userId: data.user.id, email, username }, '[AuthService] User created successfully');
    return { user: data.user };
  }

  async login({ email, password }) {
    logger.info({ email }, '[AuthService] Login attempt');

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.warn({ email, error: error.message }, '[AuthService] Login failed');
      throw ApiError.unauthorized('Credenciales invalidas');
    }

    const { data: perfil } = await supabaseAdmin
      .from('perfiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (perfil && !perfil.activo) {
      logger.warn({ userId: data.user.id }, '[AuthService] User deactivated');
      throw ApiError.forbidden('Usuario desactivado');
    }

    logger.info({ userId: data.user.id, email, rol: perfil?.rol }, '[AuthService] Login successful');
    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        username: perfil?.username,
        nombres: perfil?.nombres,
        apellidos: perfil?.apellidos,
        rol: perfil?.rol,
      },
      session: data.session,
    };
  }

  async logout(token) {
    const { error } = await supabaseAdmin.auth.admin.signOut(token);
    if (error) {
      throw ApiError.internal('Error al cerrar sesion');
    }
  }

  async refreshToken(refresh_token) {
    const { data, error } = await supabaseAdmin.auth.refreshSession({
      refresh_token,
    });

    if (error) {
      throw ApiError.unauthorized('Refresh token invalido o expirado');
    }

    return { session: data.session };
  }

  async getMe(userId) {
    const { data, error } = await supabaseAdmin
      .from('perfiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      throw ApiError.notFound('Perfil no encontrado');
    }

    return data;
  }

  async changePassword(userId, currentPassword, newPassword) {
    const { data: perfil } = await supabaseAdmin
      .from('perfiles')
      .select('username')
      .eq('id', userId)
      .single();

    const { error: loginError } = await supabaseAdmin.auth.signInWithPassword({
      email: perfil.username,
      password: currentPassword,
    });

    if (loginError) {
      throw ApiError.unauthorized('Contrasena actual incorrecta');
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) {
      throw ApiError.internal('Error al cambiar contrasena');
    }
  }
}

module.exports = new AuthService();
