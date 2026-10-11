const router = require('express').Router();

router.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
router.use('/dashboard', require('./dashboard'));
router.use('/transactions', require('./transactions'));
router.use('/wallets', require('./wallets'));
router.use('/categories', require('./categories'));
router.use('/budgets', require('./budgets'));
router.use('/savings-goals', require('./savingsGoals'));
router.use('/reports', require('./reports'));
router.use('/profile', require('./profile'));

module.exports = router;
