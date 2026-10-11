const router = require('express').Router();
const c = require('../controllers/reportController');

router.get('/summary', c.summary);
router.get('/category-breakdown', c.categoryBreakdown);
router.get('/monthly-trend', c.monthlyTrend);
router.get('/insights', c.insights);

module.exports = router;
