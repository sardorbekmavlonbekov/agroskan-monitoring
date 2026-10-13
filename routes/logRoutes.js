const router = require('express').Router();
const ctrl = require('../controllers/logController');
const auth = require('../middleware/auth');

router.use(auth);

router.route('/').get(ctrl.getAll).post(ctrl.create);
router.route('/:id').get(ctrl.getOne).put(ctrl.update).delete(ctrl.remove);

module.exports = router;
