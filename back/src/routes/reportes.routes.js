const { Router } = require('express');
const reportesController = require('../controllers/reportes.controller');
const authenticateToken = require('../middleware/auth');

const router = Router();

router.use(authenticateToken);

/**
 * @swagger
 * /reportes/dashboard:
 *   get:
 *     tags: [Reportes]
 *     summary: Dashboard principal
 *     description: |
 *       Retorna métricas agregadas: total de planillas, conteos, progreso de captura,
 *       barridos, almacenes y conteos por barrido.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Métricas del dashboard
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
 *                     totalPlanillas:
 *                       type: integer
 *                     totalConteos:
 *                       type: integer
 *                     conteosModificados:
 *                       type: integer
 *                     totalBarridos:
 *                       type: integer
 *                     totalAlmacenes:
 *                       type: integer
 *                     barridos:
 *                       type: array
 *                       items:
 *                         type: string
 *                     almacenes:
 *                       type: array
 *                       items:
 *                         type: string
 *                     conteosPorBarrido:
 *                       type: object
 *                     progresoCaptura:
 *                       type: integer
 *                       description: Porcentaje de avance (0-100)
 */
router.get('/dashboard', reportesController.dashboard);

/**
 * @swagger
 * /reportes/resumen-diferencias:
 *   get:
 *     tags: [Reportes]
 *     summary: Resumen de diferencias de inventario
 *     description: |
 *       Consulta la vista vw_resumen_diferencias_inventario con paginación.
 *       Clasifica automáticamente: EXACTO, SOBRANTE, FALTANTE.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: barrido
 *         schema:
 *           type: string
 *         description: Filtrar por barrido
 *       - in: query
 *         name: id_alm
 *         schema:
 *           type: string
 *         description: Filtrar por almacén
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
 *         description: Resumen paginado de diferencias
 */
router.get('/resumen-diferencias', reportesController.resumenDiferencias);

/**
 * @swagger
 * /reportes/resumen-diferencias-completo:
 *   get:
 *     tags: [Reportes]
 *     summary: Resumen completo de diferencias
 *     description: Retorna el conteo por estado (EXACTO, SOBRANTE, FALTANTE) y todos los detalles.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: barrido
 *         schema:
 *           type: string
 *       - in: query
 *         name: id_alm
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resumen completo
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
 *                     resumen:
 *                       type: object
 *                       properties:
 *                         exacto:
 *                           type: integer
 *                         sobrante:
 *                           type: integer
 *                         faltante:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                     detalles:
 *                       type: array
 */
router.get('/resumen-diferencias-completo', reportesController.resumenDiferenciasCompleto);

module.exports = router;
