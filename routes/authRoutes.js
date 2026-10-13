const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { register, login, getMe } = require('../controllers/authController');
const auth = require('../middleware/auth');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Juda ko'p urinish. 15 daqiqadan keyin qayta urinib ko'ring" },
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', auth, getMe);

module.exports = router;
