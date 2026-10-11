const router = require('express').Router();
const c = require('../controllers/walletController');
const validateObjectId = require('../middleware/validateObjectId');

router.get('/', c.list);
router.post('/', c.create);
router.get('/:id', validateObjectId(), c.getOne);
router.put('/:id', validateObjectId(), c.update);
router.delete('/:id', validateObjectId(), c.remove);

module.exports = router;
