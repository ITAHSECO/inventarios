const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const authenticateToken = require('../middleware/auth');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const { signupSchema, loginSchema, refreshSchema, passwordSchema } = require('../validators/auth.schema');

const router = Router();

router.post('/signup', authLimiter, validate(signupSchema), authController.signup);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/logout', authenticateToken, authController.logout);
router.get('/me', authenticateToken, authController.me);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.put('/password', authenticateToken, validate(passwordSchema), authController.changePassword);

module.exports = router;
