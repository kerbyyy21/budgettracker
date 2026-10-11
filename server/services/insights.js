const { round1 } = require('./finance');
const { peso } = require('./ledger');

// Turns the numbers into short, rule-based advice shown on the dashboard and reports.
function buildInsights({ summary, previous, breakdown, budget }) {
  const out = [];

  if (budget.status === 'over') {
    out.push({ level: 'warning', title: 'Budget exceeded', message: `You spent ${peso(budget.spent)} of your ${peso(budget.limit)} budget (${budget.percentUsed}%).` });
  } else if (budget.status === 'near') {
    out.push({ level: 'warning', title: 'Close to your limit', message: `${budget.percentUsed}% of the budget is used. About ${peso(budget.safeDailySpend)} a day keeps you safe for the remaining ${budget.daysLeft} days.` });
  } else if (budget.status === 'safe' && budget.willExceed) {
    out.push({ level: 'warning', title: 'On pace to overspend', message: `At this rate you will spend about ${peso(budget.projectedSpend)} this month, above your ${peso(budget.limit)} budget.` });
  } else if (budget.status === 'safe') {
    out.push({ level: 'success', title: 'Budget on track', message: `${peso(budget.remaining)} left. You can spend about ${peso(budget.safeDailySpend)} a day.` });
  }

  if (breakdown[0]) {
    out.push({ level: 'info', title: `Top spending: ${breakdown[0].category.name}`, message: `${breakdown[0].percentage}% of your expenses (${peso(breakdown[0].total)}) went to ${breakdown[0].category.name}.` });
  }

  if (previous.expenses > 0 && summary.expenses > 0) {
    const change = round1(((summary.expenses - previous.expenses) / previous.expenses) * 100);
    if (Math.abs(change) >= 5) {
      out.push({
        level: change > 0 ? 'warning' : 'success',
        title: change > 0 ? 'Spending is up' : 'Spending is down',
        message: `You spent ${Math.abs(change)}% ${change > 0 ? 'more' : 'less'} than last month (${peso(previous.expenses)}).`,
      });
    }
  }

  if (summary.income > 0) {
    if (summary.savingsRate >= 20) out.push({ level: 'success', title: 'Strong savings rate', message: `You kept ${summary.savingsRate}% of your income this month.` });
    else if (summary.savingsRate < 10) out.push({ level: 'warning', title: 'Low savings rate', message: `Only ${summary.savingsRate}% of your income is left. Aim for at least 10–20%.` });
  }

  return out;
}

module.exports = { buildInsights };
