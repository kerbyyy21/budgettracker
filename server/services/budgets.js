const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const { monthRange, budgetStatus, round2 } = require('./finance');

// The budget for a month; falls back to the most recent earlier budget ("carried forward").
async function budgetForMonth(key) {
  const exact = await Budget.findOne({ month: key }).lean();
  if (exact) return { limit: exact.monthlyLimit, carriedFrom: null };
  const earlier = await Budget.findOne({ month: { $lt: key } }).sort({ month: -1 }).lean();
  return earlier ? { limit: earlier.monthlyLimit, carriedFrom: earlier.month } : { limit: 0, carriedFrom: null };
}

async function spentInMonth(key) {
  const { start, end } = monthRange(key);
  const rows = await Transaction.find({ type: 'Expense', date: { $gte: start, $lt: end } }).select('amount').lean();
  return round2(rows.reduce((s, r) => s + r.amount, 0));
}

async function statusForMonth(key, now = new Date()) {
  const [{ limit, carriedFrom }, spent] = await Promise.all([budgetForMonth(key), spentInMonth(key)]);
  return { ...budgetStatus({ limit, spent, key, now }), carriedFrom };
}

module.exports = { budgetForMonth, spentInMonth, statusForMonth };
