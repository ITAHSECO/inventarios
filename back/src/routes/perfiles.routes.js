const { Router } = require('express');
const perfilesController = require('../controllers/perfiles.controller');
const authenticateToken = require('../middleware/auth');
const requireRole = require('../middleware/rbac');
const validate = require('../middleware/validate');
const {
  perfilIdParam,
  createPerfilSchema,
  updatePerfilSchema,
  pinSchema,
  validatePinSchema,
  listPerfilesSchema,
} = require('../validators/perfiles.schema');

const router = Router();

router.use(authenticateToken);

/**
 * @swagger
 * /perfiles:
 *   get:
 *     tags: [Perfiles]
 *     summary: Listar perfiles
 *     description: Retorna una lista paginada de perfiles de usuario.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 25
 *           maximum: 100
 *         description: Elementos por página
 *       - in: query
 *         name: rol
 *         schema:
 *           type: string
 *           enum: [superadmin, admin, inventariador, reportes]
 *         description: Filtrar por rol
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar en username, nombres, apellidos
 *     responses:
 *       200:
 *         description: Lista de perfiles
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       403:
 *         description: No tiene permisos
 */
router.get('/', requireRole('superadmin', 'admin'), validate(listPerfilesSchema), perfilesController.list);

/**
 * @swagger
 * /perfiles/{id}:
 *   get:
 *     tags: [Perfiles]
 *     summary: Obtener perfil por ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Perfil encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Perfil'
 *       404:
 *         description: Perfil no encontrado
 */
router.get('/:id', validate(perfilIdParam), perfilesController.getById);

/**
 * @swagger
 * /perfiles:
 *   post:
 *     tags: [Perfiles]
 *     summary: Crear perfil manualmente
 *     description: Solo superadmin puede crear perfiles directamente.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, nombres, apellidos, rol]
 *             properties:
 *               username:
 *                 type: string
 *               nombres:
 *                 type: string
 *               apellidos:
 *                 type: string
 *               rol:
 *                 type: string
 *                 enum: [superadmin, admin, inventariador, reportes]
 *               pin_autorizacion:
 *                 type: string
 *               activo:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Perfil creado
 *       403:
 *         description: Solo superadmin
 */
router.post('/', requireRole('superadmin'), validate(createPerfilSchema), perfilesController.create);

/**
 * @swagger
 * /perfiles/{id}:
 *   put:
 *     tags: [Perfiles]
 *     summary: Actualizar perfil
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombres:
 *                 type: string
 *               apellidos:
 *                 type: string
 *               rol:
 *                 type: string
 *                 enum: [superadmin, admin, inventariador, reportes]
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Perfil actualizado
 *       403:
 *         description: No tiene permisos
 */
router.put('/:id', requireRole('superadmin', 'admin'), validate(updatePerfilSchema), perfilesController.update);

/**
 * @swagger
 * /perfiles/{id}/pin:
 *   put:
 *     tags: [Perfiles]
 *     summary: Establecer PIN de supervisor
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pin]
 *             properties:
 *               pin:
 *                 type: string
 *                 minLength: 4
 *     responses:
 *       200:
 *         description: PIN establecido
 *       403:
 *         description: Solo admin/superadmin
 */
router.put('/:id/pin', requireRole('superadmin', 'admin'), validate(pinSchema), perfilesController.setPin);

/**
 * @swagger
 * /perfiles/validate-pin:
 *   post:
 *     tags: [Perfiles]
 *     summary: Validar PIN de supervisor
 *     description: Valida las credenciales del supervisor (username + PIN).
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, pin]
 *             properties:
 *               username:
 *                 type: string
 *               pin:
 *                 type: string
 *     responses:
 *       200:
 *         description: Resultado de validación
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
 *                     valid:
 *                       type: boolean
 *       403:
 *         description: PIN inválido
 */
router.post('/validate-pin', requireRole('superadmin', 'admin'), validate(validatePinSchema), perfilesController.validatePin);

/**
 * @swagger
 * /perfiles/{id}:
 *   delete:
 *     tags: [Perfiles]
 *     summary: Eliminar usuario
 *     description: Elimina el usuario de Supabase Auth y su perfil. Solo superadmin.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Usuario eliminado
 *       403:
 *         description: Solo superadmin
 *       404:
 *         description: Perfil no encontrado
 */
router.delete('/:id', requireRole('superadmin'), validate(perfilIdParam), perfilesController.delete);

module.exports = router;
