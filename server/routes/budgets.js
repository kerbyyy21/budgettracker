const router = require('express').Router();
const c = require('../controllers/budgetController');

router.get('/', c.list);
router.get('/status', c.status); // must stay above /:month
router.put('/:month', c.upsert);
router.delete('/:month', c.remove);

module.exports = router;
