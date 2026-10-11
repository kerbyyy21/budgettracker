const Transaction = require('../models/Transaction');
const SavingsGoal = require('../models/SavingsGoal');
const asyncHandler = require('../utils/asyncHandler');
const { monthKey, shiftMonth, summarize, categoryBreakdown, goalProgress } = require('../services/finance');
const { walletBalances, availableToSave } = require('../services/ledger');
const { statusForMonth } = require('../services/budgets');
const { buildInsights } = require('../services/insights');
const { ensureProfile } = require('../services/profile');
const { loadMonth } = require('./reportController');

const POPULATE = [
  { path: 'category', select: 'name type icon color' },
  { path: 'wallet', select: 'name type color' },
];

// GET /api/dashboard  — everything the home screen needs in one call
exports.get = asyncHandler(async (req, res) => {
  const key = monthKey(new Date());
  const prevKey = shiftMonth(key, -1);

  const [profile, money, balances, txs, prevTxs, budget, recent, goals] = await Promise.all([
    ensureProfile(),
    availableToSave(),
    walletBalances(),
    loadMonth(key),
    loadMonth(prevKey),
    statusForMonth(key),
    Transaction.find().sort({ date: -1, _id: -1 }).limit(5).populate(POPULATE).lean(),
    SavingsGoal.find().lean(),
  ]);

  const summary = summarize(txs, key);
  const breakdown = categoryBreakdown(txs.filter((t) => t.type === 'Expense'));
  const previous = summarize(prevTxs, prevKey);

  res.json({
    user: { name: profile.name, plan: profile.plan },
    month: key,
    money,
    summary: { ...summary, largestExpense: undefined, smallestExpense: undefined },
    budget,
    topCategory: breakdown[0] ?? null,
    wallets: [...balances.values()].map((r) => ({ ...r.wallet, income: r.income, expenses: r.expenses, balance: r.balance })),
    recentTransactions: recent,
    goals: goals
      .map((g) => ({ ...g, progress: goalProgress(g) }))
      .sort((a, b) => b.progress.percent - a.progress.percent)
      .slice(0, 3),
    insights: buildInsights({ summary, previous, breakdown, budget }).slice(0, 3),
  });
});
