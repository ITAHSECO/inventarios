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
} = require('../validators/planillas.schema');

const router = Router();

router.use(authenticateToken);

router.get('/', validate(listPlanillasSchema), planillasController.list);
router.get('/barridos', planillasController.getBarridos);
router.get('/almacenes', planillasController.getAlmacenes);
router.get('/:id', validate(planillaIdParam), planillasController.getById);
router.get('/:id/conteos', validate(planillaIdParam), planillasController.getConteosByPlanilla);
router.post('/', requireRole('superadmin', 'admin'), validate(createPlanillaSchema), planillasController.create);
router.post('/bulk', requireRole('superadmin', 'admin'), planillasController.bulkCreate);
router.put('/:id', requireRole('superadmin', 'admin'), validate(updatePlanillaSchema), planillasController.update);
router.delete('/:id', requireRole('superadmin'), validate(planillaIdParam), planillasController.delete);

module.exports = router;
