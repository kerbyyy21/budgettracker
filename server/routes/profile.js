const router = require('express').Router();
const c = require('../controllers/profileController');

router.get('/', c.get);
router.put('/', c.update);
router.get('/plans', c.plans);
router.post('/subscribe', c.subscribe);

module.exports = router;
