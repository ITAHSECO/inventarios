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

router.get('/mis-conteos', conteosController.getMisConteos);
router.get('/', validate(listConteosSchema), conteosController.list);
router.get('/:id', validate(conteoIdParam), conteosController.getById);
router.post('/', requireRole('inventariador', 'admin', 'superadmin'), validate(createConteoSchema), conteosController.create);
router.post('/bulk', requireRole('inventariador', 'admin', 'superadmin'), validate(bulkConteoSchema), conteosController.bulkCreate);
router.put('/:id', requireRole('inventariador', 'admin', 'superadmin'), validate(updateConteoSchema), conteosController.update);
router.put('/:id/supervisor-edit', requireRole('admin', 'superadmin'), requirePinValidation, validate(supervisorEditSchema), conteosController.supervisorEdit);
router.delete('/:id', requireRole('admin', 'superadmin'), validate(conteoIdParam), conteosController.delete);

module.exports = router;
