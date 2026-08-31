const { Router } = require('express');
const barridosController = require('../controllers/barridos.controller');
const authenticateToken = require('../middleware/auth');
const requireRole = require('../middleware/rbac');
const validate = require('../middleware/validate');
const {
  barridoIdParam,
  createBarridoSchema,
  updateBarridoSchema,
  listBarridosSchema,
  asignarUsuariosSchema,
  desasignarUsuarioSchema,
} = require('../validators/barridos.schema');

const router = Router();

router.use(authenticateToken);

/**
 * @swagger
 * /barridos:
 *   get:
 *     tags: [Barridos]
 *     summary: Listar barridos
 *     description: Retorna una lista paginada de barridos (campanas de inventario).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 25
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [activo, inactivo, cerrado]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de barridos
 */
router.get('/', requireRole('superadmin', 'admin'), validate(listBarridosSchema), barridosController.list);

/**
 * @swagger
 * /barridos/inventariadores:
 *   get:
 *     tags: [Barridos]
 *     summary: Listar inventariadores disponibles
 *     description: Retorna todos los usuarios con rol inventariador para asignacion.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de inventariadores
 */
router.get('/inventariadores', requireRole('superadmin', 'admin'), barridosController.getInventariadores);

/**
 * @swagger
 * /barridos/mis-barridos:
 *   get:
 *     tags: [Barridos]
 *     summary: Mis barridos asignados
 *     description: Retorna los barridos activos asignados al inventariador autenticado.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de barridos asignados
 */
router.get('/mis-barridos', barridosController.getMisBarridos);

/**
 * @swagger
 * /barridos:
 *   post:
 *     tags: [Barridos]
 *     summary: Crear barrido
 *     description: Crea una nueva campana de inventario.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, fecha_inicio]
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: INVENTARIO Q1 2026
 *               estado:
 *                 type: string
 *                 enum: [activo, inactivo, cerrado]
 *                 default: activo
 *               fecha_inicio:
 *                 type: string
 *                 format: date
 *               fecha_fin:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Barrido creado
 *       409:
 *         description: Ya existe un barrido con ese nombre
 */
router.post('/', requireRole('superadmin', 'admin'), validate(createBarridoSchema), barridosController.create);

/**
 * @swagger
 * /barridos/{id}:
 *   put:
 *     tags: [Barridos]
 *     summary: Actualizar barrido
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               estado:
 *                 type: string
 *                 enum: [activo, inactivo, cerrado]
 *               fecha_inicio:
 *                 type: string
 *                 format: date
 *               fecha_fin:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Barrido actualizado
 *       404:
 *         description: Barrido no encontrado
 */
router.put('/:id', requireRole('superadmin', 'admin'), validate(updateBarridoSchema), barridosController.update);

/**
 * @swagger
 * /barridos/{id}/usuarios:
 *   get:
 *     tags: [Barridos]
 *     summary: Ver asignaciones de un barrido
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de usuarios asignados
 */
router.get('/:id/usuarios', requireRole('superadmin', 'admin'), validate(barridoIdParam), barridosController.getUsuarios);

/**
 * @swagger
 * /barridos/{id}/usuarios:
 *   post:
 *     tags: [Barridos]
 *     summary: Asignar inventariadores a un barrido
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [usuario_ids]
 *             properties:
 *               usuario_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       201:
 *         description: Usuarios asignados
 *       409:
 *         description: Algunos usuarios ya estan asignados
 */
router.post('/:id/usuarios', requireRole('superadmin', 'admin'), validate(asignarUsuariosSchema), barridosController.asignarUsuarios);

/**
 * @swagger
 * /barridos/{id}/usuarios/{uid}:
 *   delete:
 *     tags: [Barridos]
 *     summary: Desasignar inventariador de un barrido
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Usuario desasignado
 *       404:
 *         description: Asignacion no encontrada
 */
router.delete('/:id/usuarios/:uid', requireRole('superadmin', 'admin'), validate(desasignarUsuarioSchema), barridosController.desasignarUsuario);

module.exports = router;
