const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const authenticateToken = require('../middleware/auth');
const requireRole = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const { signupSchema, loginSchema, refreshSchema, passwordSchema, bulkSignupSchema } = require('../validators/auth.schema');

const router = Router();

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     tags: [Auth]
 *     summary: Registrar nuevo usuario
 *     description: Crea un usuario en Supabase Auth y automáticamente genera su perfil en la tabla perfiles.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, username, nombres, apellidos]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: usuario@correo.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: MiPassword123
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *                 pattern: '^[a-zA-Z0-9_.]+$'
 *                 description: Letras, numeros, guiones bajos y puntos
 *                 example: jdoe
 *               nombres:
 *                 type: string
 *                 example: Juan
 *               apellidos:
 *                 type: string
 *                 example: Doe
 *               rol:
 *                 type: string
 *                 enum: [superadmin, admin, inventariador, reportes]
 *                 default: inventariador
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *       400:
 *         description: Error de validación
 *       409:
 *         description: Email o username ya existen
 */
router.post('/signup', authLimiter, validate(signupSchema), authController.signup);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Iniciar sesión
 *     description: Autentica al usuario y retorna tokens JWT (access + refresh).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sesión iniciada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/Perfil'
 *                     session:
 *                       type: object
 *                       properties:
 *                         access_token:
 *                           type: string
 *                         refresh_token:
 *                           type: string
 *       401:
 *         description: Credenciales inválidas
 */
router.post('/login', authLimiter, validate(loginSchema), authController.login);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Cerrar sesión
 *     description: Invalida la sesión actual del usuario.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sesión cerrada exitosamente
 *       401:
 *         description: No autenticado
 */
router.post('/logout', authenticateToken, authController.logout);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Obtener perfil del usuario actual
 *     description: Retorna los datos del perfil del usuario autenticado.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Perfil'
 *       401:
 *         description: No autenticado
 */
router.get('/me', authenticateToken, authController.me);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refrescar token de acceso
 *     description: Genera un nuevo access token usando el refresh token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refresh_token]
 *             properties:
 *               refresh_token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refrescado exitosamente
 *       401:
 *         description: Refresh token inválido o expirado
 */
router.post('/refresh', validate(refreshSchema), authController.refresh);

/**
 * @swagger
 * /auth/password:
 *   put:
 *     tags: [Auth]
 *     summary: Cambiar contraseña
 *     description: Cambia la contraseña del usuario autenticado.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [current_password, new_password]
 *             properties:
 *               current_password:
 *                 type: string
 *               new_password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Contraseña cambiada exitosamente
 *       401:
 *         description: Contraseña actual incorrecta
 */
router.put('/password', authenticateToken, validate(passwordSchema), authController.changePassword);

/**
 * @swagger
 * /auth/bulk-signup:
 *   post:
 *     tags: [Auth]
 *     summary: Carga masiva de usuarios
 *     description: Crea múltiples usuarios en una sola operación. Si ocurre un error, revierte los creados exitosamente.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [usuarios]
 *             properties:
 *               usuarios:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required: [email, password, username, nombres, apellidos]
 *                   properties:
 *                     email:
 *                       type: string
 *                       format: email
 *                     password:
 *                       type: string
 *                       minLength: 6
 *                     username:
 *                       type: string
 *                       minLength: 3
 *                       maxLength: 50
 *                       pattern: '^[a-zA-Z0-9_.]+$'
 *                     nombres:
 *                       type: string
 *                     apellidos:
 *                       type: string
 *                     rol:
 *                       type: string
 *                       enum: [superadmin, admin, inventariador, reportes]
 *                       default: inventariador
 *     responses:
 *       201:
 *         description: Usuarios creados exitosamente
 *       400:
 *         description: Error de validación o en una de las filas
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No tiene permisos
 */
router.post('/bulk-signup', authenticateToken, requireRole('superadmin', 'admin'), authLimiter, validate(bulkSignupSchema), authController.bulkSignup);

module.exports = router;
