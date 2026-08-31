const { Router } = require('express');
const planillasController = require('../controllers/planillas.controller');
const authenticateToken = require('../middleware/auth');
const requireRole = require('../middleware/rbac');
const validate = require('../middleware/validate');
const {
  createPlanillaSchema,
  updatePlanillaSchema,
  planillaIdParam,
  listPlanillasSchema,
  bulkCreatePlanillaSchema,
} = require('../validators/planillas.schema');

const router = Router();

router.use(authenticateToken);

/**
 * @swagger
 * /planillas:
 *   get:
 *     tags: [Planillas]
 *     summary: Listar planillas de inventario
 *     description: Retorna una lista paginada de las planillas (snapshot de barrido).
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
 *         name: barrido
 *         schema:
 *           type: string
 *         description: Filtrar por código de barrido
 *       - in: query
 *         name: id_alm
 *         schema:
 *           type: string
 *         description: Filtrar por almacén
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de planillas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/', validate(listPlanillasSchema), planillasController.list);

/**
 * @swagger
 * /planillas/barridos:
 *   get:
 *     tags: [Planillas]
 *     summary: Listar códigos de barrido únicos
 *     description: Retorna los valores distintos de barrido para poblar dropdowns.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de barridos
 */
router.get('/barridos', planillasController.getBarridos);

/**
 * @swagger
 * /planillas/almacenes:
 *   get:
 *     tags: [Planillas]
 *     summary: Listar almacenes únicos
 *     description: Retorna los valores distintos de id_alm para poblar dropdowns.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de almacenes
 */
router.get('/almacenes', planillasController.getAlmacenes);

/**
 * @swagger
 * /planillas/{id}:
 *   get:
 *     tags: [Planillas]
 *     summary: Obtener planilla por ID
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
 *         description: Planilla encontrada
 *       404:
 *         description: Planilla no encontrada
 */
router.get('/:id', validate(planillaIdParam), planillasController.getById);

/**
 * @swagger
 * /planillas/{id}/conteos:
 *   get:
 *     tags: [Planillas]
 *     summary: Obtener conteos de un barrido
 *     description: Retorna todos los conteos capturados para un barrido específico (query por barrido_id).
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
 *         description: Lista de conteos
 */
router.get('/:id/conteos', validate(planillaIdParam), planillasController.getConteosByBarrido);

/**
 * @swagger
 * /planillas:
 *   post:
 *     tags: [Planillas]
 *     summary: Crear planilla individual
 *     description: Solo superadmin y admin pueden crear planillas.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Planilla'
 *     responses:
 *       201:
 *         description: Planilla creada
 */
router.post('/', requireRole('superadmin', 'admin'), validate(createPlanillaSchema), planillasController.create);

/**
 * @swagger
 * /planillas/bulk:
 *   post:
 *     tags: [Planillas]
 *     summary: Carga masiva de planillas
 *     description: Inserta múltiples planillas en una sola operación.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [barrido, planillas]
 *             properties:
 *               barrido:
 *                 type: string
 *                 description: Código de barrido (una sola vez para todos los items)
 *               planillas:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id_alm:
 *                       type: string
 *                     codigo:
 *                       type: string
 *                     descripcion:
 *                       type: string
 *                     existencia:
 *                       type: number
 *                     cunidad:
 *                       type: string
 *                     serie_lote:
 *                       type: string
 *                     maneja_serie_lote:
 *                       type: boolean
 *     responses:
 *       201:
 *         description: Planillas insertadas
 */
router.post('/bulk', requireRole('superadmin', 'admin'), validate(bulkCreatePlanillaSchema), planillasController.bulkCreate);

/**
 * @swagger
 * /planillas/{id}:
 *   put:
 *     tags: [Planillas]
 *     summary: Actualizar planilla
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
 *               existencia:
 *                 type: number
 *               descripcion:
 *                 type: string
 *               maneja_serie_lote:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Planilla actualizada
 */
router.put('/:id', requireRole('superadmin', 'admin'), validate(updatePlanillaSchema), planillasController.update);

/**
 * @swagger
 * /planillas/{id}:
 *   delete:
 *     tags: [Planillas]
 *     summary: Eliminar planilla
 *     description: Solo superadmin puede eliminar planillas.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Planilla eliminada
 *       403:
 *         description: Solo superadmin
 */
router.delete('/:id', requireRole('superadmin'), validate(planillaIdParam), planillasController.delete);

module.exports = router;
