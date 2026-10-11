const SavingsGoal = require('../models/SavingsGoal');
const SavingsEntry = require('../models/SavingsEntry');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/HttpError');
const { pick, amountParam } = require('../utils/query');
const { goalProgress, round2 } = require('../services/finance');
const { availableToSave, peso } = require('../services/ledger');

const FIELDS = ['title', 'targetAmount', 'targetDate', 'color'];
const withProgress = (goal) => ({ ...(goal.toObject ? goal.toObject() : goal), progress: goalProgress(goal) });

// GET /api/savings-goals  — goals with progress, plus overall totals
exports.list = asyncHandler(async (req, res) => {
  const [goals, money] = await Promise.all([SavingsGoal.find().sort({ createdAt: -1 }).lean(), availableToSave()]);
  const data = goals.map(withProgress);
  res.json({
    data,
    totals: {
      totalTarget: round2(goals.reduce((s, g) => s + g.targetAmount, 0)),
      totalSaved: round2(goals.reduce((s, g) => s + g.savedAmount, 0)),
      completed: data.filter((g) => g.progress.status === 'completed').length,
      availableToSave: money.available,
    },
  });
});

// GET /api/savings-goals/:id  — goal with its deposit/withdrawal history
exports.getOne = asyncHandler(async (req, res) => {
  const goal = await SavingsGoal.findById(req.params.id).lean();
  if (!goal) throw new HttpError(404, 'Savings goal not found');
  const [entries, money] = await Promise.all([
    SavingsEntry.find({ goal: goal._id }).sort({ date: -1, _id: -1 }).lean(),
    availableToSave(),
  ]);
  res.json({ ...withProgress(goal), entries, availableToSave: money.available });
});

// POST /api/savings-goals
exports.create = asyncHandler(async (req, res) => {
  const goal = new SavingsGoal({ ...pick(req.body, FIELDS), savedAmount: 0 });
  if (goal.targetDate && goal.targetDate < new Date()) {
    throw new HttpError(400, 'Validation failed', { targetDate: 'Target date must be in the future' });
  }
  await goal.save();
  res.status(201).json(withProgress(goal));
});

// PUT /api/savings-goals/:id
exports.update = asyncHandler(async (req, res) => {
  const goal = await SavingsGoal.findById(req.params.id);
  if (!goal) throw new HttpError(404, 'Savings goal not found');
  goal.set(pick(req.body, FIELDS));
  if (goal.targetAmount < goal.savedAmount) {
    throw new HttpError(400, 'Validation failed', { targetAmount: `Target cannot be lower than the ${peso(goal.savedAmount)} already saved` });
  }
  await goal.save();
  res.json(withProgress(goal));
});

// DELETE /api/savings-goals/:id  — saved money returns to the available balance
exports.remove = asyncHandler(async (req, res) => {
  const goal = await SavingsGoal.findById(req.params.id);
  if (!goal) throw new HttpError(404, 'Savings goal not found');
  await SavingsEntry.deleteMany({ goal: goal._id });
  await goal.deleteOne();
  res.json({ message: 'Savings goal deleted', id: req.params.id, released: goal.savedAmount });
});

// Optimistic update: only succeeds if nobody changed savedAmount in the meantime.
async function applyChange(goal, newSaved) {
  const updated = await SavingsGoal.findOneAndUpdate(
    { _id: goal._id, savedAmount: goal.savedAmount },
    { $set: { savedAmount: newSaved } },
    { new: true }
  );
  if (!updated) throw new HttpError(400, 'The goal changed while you were saving. Please try again.');
  return updated;
}

// POST /api/savings-goals/:id/deposit
exports.deposit = asyncHandler(async (req, res) => {
  const amount = amountParam(req.body.amount);
  const goal = await SavingsGoal.findById(req.params.id);
  if (!goal) throw new HttpError(404, 'Savings goal not found');

  const remaining = round2(goal.targetAmount - goal.savedAmount);
  if (remaining <= 0) throw new HttpError(400, 'This goal is already completed');
  if (amount > remaining) throw new HttpError(400, `You only need ${peso(remaining)} more to reach this goal`);

  const { available } = await availableToSave();
  if (amount > available) throw new HttpError(400, `Only ${peso(available)} is available to save right now`);

  const updated = await applyChange(goal, round2(goal.savedAmount + amount));
  const entry = await SavingsEntry.create({ goal: goal._id, type: 'Deposit', amount, note: req.body.note });
  res.status(201).json({ goal: withProgress(updated), entry, availableToSave: round2(available - amount) });
});

// POST /api/savings-goals/:id/withdraw
exports.withdraw = asyncHandler(async (req, res) => {
  const amount = amountParam(req.body.amount);
  const goal = await SavingsGoal.findById(req.params.id);
  if (!goal) throw new HttpError(404, 'Savings goal not found');

  if (amount > goal.savedAmount) throw new HttpError(400, `Only ${peso(goal.savedAmount)} is saved in this goal`);

  const updated = await applyChange(goal, round2(goal.savedAmount - amount));
  const entry = await SavingsEntry.create({ goal: goal._id, type: 'Withdrawal', amount, note: req.body.note });
  const { available } = await availableToSave();
  res.status(201).json({ goal: withProgress(updated), entry, availableToSave: available });
});
