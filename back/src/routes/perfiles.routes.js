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

router.get('/', requireRole('superadmin', 'admin'), validate(listPerfilesSchema), perfilesController.list);
router.get('/:id', validate(perfilIdParam), perfilesController.getById);
router.post('/', requireRole('superadmin'), validate(createPerfilSchema), perfilesController.create);
router.put('/:id', requireRole('superadmin', 'admin'), validate(updatePerfilSchema), perfilesController.update);
router.put('/:id/pin', requireRole('superadmin', 'admin'), validate(pinSchema), perfilesController.setPin);
router.post('/validate-pin', requireRole('superadmin', 'admin'), validate(validatePinSchema), perfilesController.validatePin);

module.exports = router;
