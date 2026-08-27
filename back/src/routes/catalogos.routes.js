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

router.get('/', validate(listCatalogosSchema), catalogosController.list);
router.get('/activos', catalogosController.getActivos);
router.get('/tablas', catalogosController.getTablas);
router.get('/:id', validate(catalogoIdParam), catalogosController.getById);
router.post('/', requireRole('superadmin', 'admin'), validate(createCatalogoSchema), catalogosController.create);
router.put('/:id', requireRole('superadmin', 'admin'), validate(updateCatalogoSchema), catalogosController.update);

module.exports = router;
