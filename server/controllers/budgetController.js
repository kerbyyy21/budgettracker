const Budget = require('../models/Budget');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/HttpError');
const { monthParam } = require('../utils/query');
const { isValidMonthKey } = require('../services/finance');
const { statusForMonth } = require('../services/budgets');

// GET /api/budgets
exports.list = asyncHandler(async (req, res) => {
  res.json({ data: await Budget.find().sort({ month: -1 }).lean() });
});

// GET /api/budgets/status?month=2026-10  — spent vs limit, pace, projection
exports.status = asyncHandler(async (req, res) => {
  res.json(await statusForMonth(monthParam(req.query.month)));
});

function assertMonth(req) {
  if (!isValidMonthKey(req.params.month)) throw new HttpError(400, 'month must look like 2026-10');
}

// PUT /api/budgets/:month  — create or replace the budget for a month
exports.upsert = asyncHandler(async (req, res) => {
  assertMonth(req);
  const existing = await Budget.findOne({ month: req.params.month });
  const budget = existing ?? new Budget({ month: req.params.month });
  budget.monthlyLimit = req.body.monthlyLimit;
  await budget.save();
  res.status(existing ? 200 : 201).json(budget);
});

// DELETE /api/budgets/:month
exports.remove = asyncHandler(async (req, res) => {
  assertMonth(req);
  const budget = await Budget.findOneAndDelete({ month: req.params.month });
  if (!budget) throw new HttpError(404, 'No budget set for that month');
  res.json({ message: 'Budget removed', month: req.params.month });
});
