const { Router } = require('express');
const reportesController = require('../controllers/reportes.controller');
const authenticateToken = require('../middleware/auth');

const router = Router();

router.use(authenticateToken);

router.get('/resumen-diferencias', reportesController.resumenDiferencias);
router.get('/resumen-diferencias-completo', reportesController.resumenDiferenciasCompleto);
router.get('/dashboard', reportesController.dashboard);

module.exports = router;
