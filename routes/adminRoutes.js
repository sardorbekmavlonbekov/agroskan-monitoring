const router = require('express').Router();
const { getUsers, getUserById, updateUserStatus, getAnalytics } = require('../controllers/adminController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

router.use(auth, admin);

router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.patch('/users/:id/status', updateUserStatus);
router.get('/analytics', getAnalytics);

module.exports = router;
