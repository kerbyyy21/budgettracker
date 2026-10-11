const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const { round2 } = require('./money');
const { monthRange } = require('./dates');

// Income / expense totals and counts for one "YYYY-MM"
async function monthTotals(month) {
  const { start, end } = monthRange(month);
  const rows = await Transaction.aggregate([
    { $match: { date: { $gte: start, $lt: end } } },
    { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);
  const get = (t) => rows.find((r) => r._id === t) || { total: 0, count: 0 };
  const income = round2(get('Income').total);
  const expense = round2(get('Expense').total);
  return { income, expense, net: round2(income - expense), incomeCount: get('Income').count, expenseCount: get('Expense').count, count: get('Income').count + get('Expense').count };
}

// Totals grouped by category for one month and one type, biggest first, with the category details attached
async function totalsByCategory(month, type = 'Expense') {
  const { start, end } = monthRange(month);
  const rows = await Transaction.aggregate([
    { $match: { type, date: { $gte: start, $lt: end } } },
    { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { total: -1 } },
  ]);
  const categories = await Category.find({ _id: { $in: rows.map((r) => r._id) } });
  const byId = new Map(categories.map((c) => [String(c._id), c]));
  return rows
    .filter((r) => byId.has(String(r._id)))
    .map((r) => {
      const c = byId.get(String(r._id));
      return { categoryId: c._id, name: c.name, color: c.color, emoji: c.emoji, total: round2(r.total), count: r.count };
    });
}

// Expense total per calendar day of a month -> Map("YYYY-MM-DD", total)
async function dailyExpenses(month) {
  const { start, end } = monthRange(month);
  const rows = await Transaction.aggregate([
    { $match: { type: 'Expense', date: { $gte: start, $lt: end } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, total: { $sum: '$amount' } } },
  ]);
  return new Map(rows.map((r) => [r._id, round2(r.total)]));
}

module.exports = { monthTotals, totalsByCategory, dailyExpenses };
