const { Router } = require('express');
const configCapturaController = require('../controllers/configcaptura.controller');
const authenticateToken = require('../middleware/auth');
const requireRole = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { updateConfigSchema } = require('../validators/configcaptura.schema');

const router = Router();

router.use(authenticateToken);

/**
 * @swagger
 * /config-captura:
 *   get:
 *     tags: [Config Captura]
 *     summary: Obtener configuracion de campos de captura
 *     description: |
 *       Retorna la configuracion de visibilidad y obligatoriedad de cada campo
 *       del formulario de captura. El inventariador la usa para renderizar el form.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de configuracion de campos
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
 *                     type: object
 *                     properties:
 *                       campo:
 *                         type: string
 *                         example: almacen
 *                       activo:
 *                         type: boolean
 *                       obligatorio:
 *                         type: boolean
 */
router.get('/', configCapturaController.getAll);

/**
 * @swagger
 * /config-captura:
 *   put:
 *     tags: [Config Captura]
 *     summary: Actualizar configuracion de campos de captura
 *     description: Activa/desactiva campos y marca obligatoriedad. Solo superadmin y admin.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [campos]
 *             properties:
 *               campos:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [campo, activo, obligatorio]
 *                   properties:
 *                     campo:
 *                       type: string
 *                       enum: [codigo, unidad, descripcion, ubicacion, conteo, almacen, marca, serie_lote, vcto, observacion]
 *                     activo:
 *                       type: boolean
 *                     obligatorio:
 *                       type: boolean
 *     responses:
 *       200:
 *         description: Configuracion actualizada
 *       403:
 *         description: Solo superadmin/admin
 */
router.put('/', requireRole('superadmin', 'admin'), validate(updateConfigSchema), configCapturaController.update);

module.exports = router;
