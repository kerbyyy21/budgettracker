// Plan rules, mirroring the BudgetTracker mobile app's Free / Plus / Premium tiers.
const PLANS = {
  Free: { maxWallets: 2, categoryBudgets: false, price: { Monthly: 0, Yearly: 0 }, tagline: 'Track the basics' },
  Plus: { maxWallets: 5, categoryBudgets: true, price: { Monthly: 99, Yearly: 999 }, tagline: 'Smart finance insights' },
  Premium: { maxWallets: null, categoryBudgets: true, price: { Monthly: 179, Yearly: 1799 }, tagline: 'Complete finance tools' },
};

const TRIAL_DAYS = 7;

module.exports = { PLANS, TRIAL_DAYS };
