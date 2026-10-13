const router = require('express').Router();
const ctrl = require('../controllers/expenseController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/stats', ctrl.getStats); // /:id dan oldin turishi shart
router.route('/').get(ctrl.getAll).post(ctrl.create);
router.route('/:id').get(ctrl.getOne).put(ctrl.update).delete(ctrl.remove);

module.exports = router;
