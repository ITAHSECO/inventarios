const { Router } = require('express');
const conteosController = require('../controllers/conteos.controller');
const authenticateToken = require('../middleware/auth');
const requireRole = require('../middleware/rbac');
const requirePinValidation = require('../middleware/pin');
const validate = require('../middleware/validate');
const {
  createConteoSchema,
  bulkConteoSchema,
  updateConteoSchema,
  supervisorEditSchema,
  conteoIdParam,
  listConteosSchema,
} = require('../validators/conteos.schema');

const router = Router();

router.use(authenticateToken);

/**
 * @swagger
 * /conteos/mis-conteos:
 *   get:
 *     tags: [Conteos]
 *     summary: Obtener mis conteos
 *     description: Retorna los conteos del inventariador autenticado. Solo inventariadores ven sus propios registros.
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
 *     responses:
 *       200:
 *         description: Lista de mis conteos
 */
router.get('/mis-conteos', conteosController.getMisConteos);

/**
 * @swagger
 * /conteos:
 *   get:
 *     tags: [Conteos]
 *     summary: Listar conteos
 *     description: |
 *       Retorna una lista paginada de conteos.
 *       - superadmin, admin, reportes: ven todos los registros
 *       - inventariador: solo ve sus propios registros
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
 *       - in: query
 *         name: codigo
 *         schema:
 *           type: string
 *       - in: query
 *         name: inventariador_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: barrido_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de conteos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/', validate(listConteosSchema), conteosController.list);

/**
 * @swagger
 * /conteos/{id}:
 *   get:
 *     tags: [Conteos]
 *     summary: Obtener conteo por ID
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
 *         description: Conteo encontrado
 *       404:
 *         description: Conteo no encontrado
 */
router.get('/:id', validate(conteoIdParam), conteosController.getById);

/**
 * @swagger
 * /conteos:
 *   post:
 *     tags: [Conteos]
 *     summary: Crear conteo (captura de campo)
 *     description: |
 *       Crea un nuevo conteo de inventario. El inventariador_id se asigna automáticamente del token JWT.
 *       Se envía barrido (nombre), barrido_id (FK) y codigo (código del artículo).
 *       El backend valida que la combinación barrido+codigo exista en planillasinventario.
 *       Si el artículo maneja serie/lote, el campo serie_lote es obligatorio.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ubicacion, conteo]
 *             properties:
 *               barrido_id:
 *                 type: integer
 *                 description: ID del barrido activo
 *               barrido:
 *                 type: string
 *                 description: Nombre del barrido
 *               codigo:
 *                 type: string
 *                 description: Código del artículo
 *               ubicacion:
 *                 type: string
 *                 example: ESTANTE-01
 *               conteo:
 *                 type: number
 *                 minimum: 0
 *                 example: 50
 *               cunidad:
 *                 type: string
 *               serie_lote:
 *                 type: string
 *                 default: "-"
 *               vcto_capturado:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *               observacion:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Conteo creado
 *       400:
 *         description: Serie/lote requerido cuando maneja_serie_lote=true
 */
router.post('/', requireRole('inventariador', 'admin', 'superadmin'), validate(createConteoSchema), conteosController.create);

/**
 * @swagger
 * /conteos/bulk:
 *   post:
 *     tags: [Conteos]
 *     summary: Carga masiva de conteos (sync offline)
 *     description: |
 *       Inserta múltiples conteos para sincronización desde modo offline.
 *       El client_capture_id permite idempotencia para evitar duplicados.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               capturas:
 *                 type: array
 *                 maxItems: 500
 *                 items:
 *                   type: object
 *                   properties:
 *                     barrido:
 *                       type: string
 *                     barrido_id:
 *                       type: integer
 *                     codigo:
 *                       type: string
 *                     ubicacion:
 *                       type: string
 *                     conteo:
 *                       type: number
 *                     cunidad:
 *                       type: string
 *                     serie_lote:
 *                       type: string
 *                     client_capture_id:
 *                       type: string
 *                       format: uuid
 *     responses:
 *       201:
 *         description: Resultado de la carga masiva
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 inserted:
 *                   type: integer
 *                 skipped:
 *                   type: integer
 *                 errors:
 *                   type: array
 */
router.post('/bulk', requireRole('inventariador', 'admin', 'superadmin'), validate(bulkConteoSchema), conteosController.bulkCreate);

/**
 * @swagger
 * /conteos/{id}:
 *   put:
 *     tags: [Conteos]
 *     summary: Actualizar conteo
 *     description: |
 *       El inventariador solo puede editar si no ha sido modificado por supervisor.
 *       superadmin y admin pueden editar siempre.
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
 *               ubicacion:
 *                 type: string
 *               conteo:
 *                 type: number
 *               serie_lote:
 *                 type: string
 *               vcto_capturado:
 *                 type: string
 *                 format: date
 *               observacion:
 *                 type: string
 *     responses:
 *       200:
 *         description: Conteo actualizado
 *       403:
 *         description: Registro modificado por supervisor, no editable
 */
router.put('/:id', requireRole('inventariador', 'admin', 'superadmin'), validate(updateConteoSchema), conteosController.update);

/**
 * @swagger
 * /conteos/{id}/supervisor-edit:
 *   put:
 *     tags: [Conteos]
 *     summary: Edición de supervisor
 *     description: |
 *       Permite al supervisor corregir un conteo. Requiere validación de PIN.
 *       Marca el registro como modificado_por_supervisor=true, bloqueando ediciones futuras del inventariador.
 *     security:
 *       - bearerAuth: []
 *       - supervisorPin: []
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
 *               ubicacion:
 *                 type: string
 *               conteo:
 *                 type: number
 *               serie_lote:
 *                 type: string
 *               observacion:
 *                 type: string
 *     responses:
 *       200:
 *         description: Conteo corregido por supervisor
 *       403:
 *         description: PIN inválido o no tiene permisos
 */
router.put('/:id/supervisor-edit', requireRole('admin', 'superadmin'), requirePinValidation, validate(supervisorEditSchema), conteosController.supervisorEdit);

/**
 * @swagger
 * /conteos/{id}:
 *   delete:
 *     tags: [Conteos]
 *     summary: Eliminar conteo
 *     description: Solo superadmin y admin pueden eliminar conteos.
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
 *         description: Conteo eliminado
 *       403:
 *         description: Solo superadmin/admin
 */
router.delete('/:id', requireRole('admin', 'superadmin'), validate(conteoIdParam), conteosController.delete);

module.exports = router;
