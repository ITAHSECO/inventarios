const { Router } = require('express');
const authRoutes = require('./auth.routes');
const perfilesRoutes = require('./perfiles.routes');
const catalogosRoutes = require('./catalogos.routes');
const planillasRoutes = require('./planillas.routes');
const conteosRoutes = require('./conteos.routes');
const reportesRoutes = require('./reportes.routes');
const barridosRoutes = require('./barridos.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/perfiles', perfilesRoutes);
router.use('/catalogos', catalogosRoutes);
router.use('/planillas', planillasRoutes);
router.use('/conteos', conteosRoutes);
router.use('/reportes', reportesRoutes);
router.use('/barridos', barridosRoutes);

module.exports = router;
