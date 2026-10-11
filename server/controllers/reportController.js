const Transaction = require('../models/Transaction');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/HttpError');
const { monthParam, objectId } = require('../utils/query');
const { monthRange, shiftMonth, lastMonths, monthKey, summarize, categoryBreakdown, monthlyTrend } = require('../services/finance');
const { statusForMonth } = require('../services/budgets');
const { buildInsights } = require('../services/insights');

async function loadMonth(key, { wallet, type } = {}) {
  const { start, end } = monthRange(key);
  const filter = { date: { $gte: start, $lt: end } };
  if (wallet) filter.wallet = objectId(wallet, 'wallet');
  if (type) filter.type = type;
  return Transaction.find(filter).populate('category', 'name icon color type').lean();
}

// GET /api/reports/summary?month=2026-10&wallet=<id>
exports.summary = asyncHandler(async (req, res) => {
  const key = monthParam(req.query.month);
  const txs = await loadMonth(key, { wallet: req.query.wallet });
  const result = summarize(txs, key);
  const toRef = (t) => t && { _id: t._id, amount: t.amount, date: t.date, note: t.note, category: t.category };
  res.json({ ...result, largestExpense: toRef(result.largestExpense), smallestExpense: toRef(result.smallestExpense) });
});

// GET /api/reports/category-breakdown?month=2026-10&type=Expense&wallet=<id>
exports.categoryBreakdown = asyncHandler(async (req, res) => {
  const key = monthParam(req.query.month);
  const type = req.query.type ?? 'Expense';
  if (!['Income', 'Expense'].includes(type)) throw new HttpError(400, 'type must be Income or Expense');
  const txs = await loadMonth(key, { wallet: req.query.wallet, type });
  const data = categoryBreakdown(txs);
  res.json({ month: key, type, total: Math.round(data.reduce((s, r) => s + r.total, 0) * 100) / 100, data });
});

// GET /api/reports/monthly-trend?months=6&wallet=<id>
exports.monthlyTrend = asyncHandler(async (req, res) => {
  const months = parseInt(req.query.months ?? '6', 10);
  if (!Number.isInteger(months) || months < 2 || months > 12) throw new HttpError(400, 'months must be between 2 and 12');

  const keys = lastMonths(months, monthKey(new Date()));
  const filter = { date: { $gte: monthRange(keys[0]).start, $lt: monthRange(keys[keys.length - 1]).end } };
  if (req.query.wallet) filter.wallet = objectId(req.query.wallet, 'wallet');
  const txs = await Transaction.find(filter).select('type amount date').lean();
  res.json({ data: monthlyTrend(txs, keys) });
});

// GET /api/reports/insights?month=2026-10
exports.insights = asyncHandler(async (req, res) => {
  const key = monthParam(req.query.month);
  const [txs, prevTxs, budget] = await Promise.all([loadMonth(key), loadMonth(shiftMonth(key, -1)), statusForMonth(key)]);
  const summary = summarize(txs, key);
  const previous = summarize(prevTxs, shiftMonth(key, -1));
  const breakdown = categoryBreakdown(txs.filter((t) => t.type === 'Expense'));
  res.json({ month: key, data: buildInsights({ summary, previous, breakdown, budget }) });
});

exports.loadMonth = loadMonth;
