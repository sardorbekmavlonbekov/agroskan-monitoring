const router = require('express').Router();
const { getProfile, updateProfile, uploadAvatar } = require('../controllers/userController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(auth);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/upload-avatar', upload.single('avatar'), uploadAvatar);

module.exports = router;
