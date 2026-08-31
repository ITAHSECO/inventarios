const { Router } = require('express');
const catalogosController = require('../controllers/catalogos.controller');
const authenticateToken = require('../middleware/auth');
const requireRole = require('../middleware/rbac');
const validate = require('../middleware/validate');
const {
  createCatalogoSchema,
  updateCatalogoSchema,
  catalogoIdParam,
  listCatalogosSchema,
  bulkCreateCatalogoSchema,
} = require('../validators/catalogos.schema');

const router = Router();

/**
 * @swagger
 * /catalogos/activos:
 *   get:
 *     tags: [Catálogos]
 *     summary: Obtener catálogos activos
 *     description: Retorna todos los catálogos con activo=true usando la vista vw_catalogos_activos. Soporta filtro por id_tabla.
 *     parameters:
 *       - in: query
 *         name: id_tabla
 *         schema:
 *           type: string
 *         description: Filtrar por tipo de catálogo (ROL, ALMACEN, MARCA, etc.)
 *     responses:
 *       200:
 *         description: Catálogos activos
 */
router.get('/activos', catalogosController.getActivos);

/**
 * @swagger
 * /catalogos/tablas:
 *   get:
 *     tags: [Catálogos]
 *     summary: Listar tipos de tabla únicos
 *     description: Retorna los valores distintos de id_tabla para poblar dropdowns.
 *     responses:
 *       200:
 *         description: Lista de tipos de tabla
 */
router.get('/tablas', catalogosController.getTablas);

router.use(authenticateToken);

/**
 * @swagger
 * /catalogos:
 *   get:
 *     tags: [Catálogos]
 *     summary: Listar catálogos
 *     description: Retorna una lista paginada de parámetros de la maestra.
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
 *         name: id_tabla
 *         schema:
 *           type: string
 *         description: Filtrar por tipo de catálogo (ALMACEN, MARCA, CATEGORIA)
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de catálogos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/', validate(listCatalogosSchema), catalogosController.list);

/**
 * @swagger
 * /catalogos/{id}:
 *   get:
 *     tags: [Catálogos]
 *     summary: Obtener catálogo por ID
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
 *         description: Catálogo encontrado
 *       404:
 *         description: Catálogo no encontrado
 */
router.get('/:id', validate(catalogoIdParam), catalogosController.getById);

/**
 * @swagger
 * /catalogos:
 *   post:
 *     tags: [Catálogos]
 *     summary: Crear catálogo
 *     description: Solo superadmin y admin pueden crear parámetros en la maestra.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_tabla, id_elemento, descripcion]
 *             properties:
 *               id_tabla:
 *                 type: string
 *                 example: ALMACEN
 *               id_elemento:
 *                 type: string
 *                 example: ALM001
 *               descripcion:
 *                 type: string
 *                 example: Almacen Principal
 *               activo:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Catálogo creado
 *       409:
 *         description: Ya existe un catálogo con estos datos
 */
router.post('/', requireRole('superadmin', 'admin'), validate(createCatalogoSchema), catalogosController.create);

/**
 * @swagger
 * /catalogos/bulk:
 *   post:
 *     tags: [Catálogos]
 *     summary: Carga masiva de catálogos
 *     description: Inserta múltiples registros de la maestra en una sola operación. Falla completa si hay duplicados.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_tabla, catalogos]
 *             properties:
 *               id_tabla:
 *                 type: string
 *                 example: CUNIDAD
 *                 description: Tipo de catálogo (se envía UNA vez, no por item)
 *               catalogos:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required: [id_elemento, descripcion]
 *                   properties:
 *                     id_elemento:
 *                       type: string
 *                       example: PZA
 *                     descripcion:
 *                       type: string
 *                       example: Pieza
 *                     activo:
 *                       type: boolean
 *                       default: true
 *     responses:
 *       201:
 *         description: Catálogos insertados
 *       400:
 *         description: Error de validación
 *       409:
 *         description: Conflicto con registros existentes
 */
router.post('/bulk', requireRole('superadmin', 'admin'), validate(bulkCreateCatalogoSchema), catalogosController.bulkCreate);

/**
 * @swagger
 * /catalogos/{id}:
 *   put:
 *     tags: [Catálogos]
 *     summary: Actualizar catálogo
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
 *               descripcion:
 *                 type: string
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Catálogo actualizado
 *       404:
 *         description: Catálogo no encontrado
 */
router.put('/:id', requireRole('superadmin', 'admin'), validate(updateCatalogoSchema), catalogosController.update);

module.exports = router;
