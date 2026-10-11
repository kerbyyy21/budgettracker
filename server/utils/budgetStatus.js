const Budget = require('../models/Budget');
const { round2 } = require('./money');
const { monthTotals, totalsByCategory } = require('./stats');
const { currentMonth, daysInMonth, localNow } = require('./dates');

// level: ok (< 80 %), warning (80 % - 99 %), over (>= 100 %)  -- same thresholds as the mobile app
const levelFor = (percent) => (percent >= 100 ? 'over' : percent >= 80 ? 'warning' : 'ok');

const MESSAGES = {
  ok: 'You are within your monthly budget.',
  warning: 'You are close to your monthly budget limit.',
  over: 'You are over your monthly budget.',
};

async function budgetStatus(month) {
  const budget = await Budget.findOne({ month }).populate('categoryLimits.category', 'name color emoji');
  const totals = await monthTotals(month);
  if (!budget) return { month, configured: false, spent: totals.expense };

  const spent = totals.expense;
  const remaining = round2(budget.monthlyLimit - spent);
  const percentUsed = round2((spent / budget.monthlyLimit) * 100);
  const level = levelFor(percentUsed);

  const cur = currentMonth();
  const dim = daysInMonth(month);
  const dayOfMonth = month === cur ? localNow().getUTCDate() : month < cur ? dim : 0;
  const daysLeft = month === cur ? dim - dayOfMonth + 1 : month > cur ? dim : 0; // today still counts
  const dailyAllowance = daysLeft > 0 ? round2(Math.max(0, remaining) / daysLeft) : 0;
  const projectedSpend = dayOfMonth > 0 ? round2((spent / dayOfMonth) * dim) : 0; // pace so far, extended to month end

  const spentByCategory = new Map((await totalsByCategory(month, 'Expense')).map((c) => [String(c.categoryId), c.total]));
  const categories = budget.categoryLimits
    .filter((cl) => cl.category) // skip limits whose category was deleted
    .map((cl) => {
      const catSpent = spentByCategory.get(String(cl.category._id)) || 0;
      const pct = round2((catSpent / cl.limit) * 100);
      return { category: cl.category, limit: cl.limit, spent: catSpent, remaining: round2(cl.limit - catSpent), percentUsed: pct, level: levelFor(pct) };
    });

  return {
    month, configured: true, budgetId: budget._id, monthlyLimit: budget.monthlyLimit,
    spent, remaining, percentUsed, level, message: MESSAGES[level],
    daysLeft, dailyAllowance, projectedSpend, projectedOver: projectedSpend > budget.monthlyLimit && month === cur,
    categories,
  };
}

module.exports = { budgetStatus, levelFor };
