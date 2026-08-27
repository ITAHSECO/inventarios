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
} = require('../validators/catalogos.schema');

const router = Router();

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
 * /catalogos/activos:
 *   get:
 *     tags: [Catálogos]
 *     summary: Obtener catálogos activos
 *     description: Retorna todos los catálogos con activo=true usando la vista vw_catalogos_activos.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Catálogos activos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Catalogo'
 */
router.get('/activos', catalogosController.getActivos);

/**
 * @swagger
 * /catalogos/tablas:
 *   get:
 *     tags: [Catálogos]
 *     summary: Listar tipos de tabla únicos
 *     description: Retorna los valores distintos de id_tabla para poblar dropdowns.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de tipos de tabla
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: [ALMACEN, MARCA, CATEGORIA]
 */
router.get('/tablas', catalogosController.getTablas);

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
