const SavingsGoal = require('../models/SavingsGoal');
const SavingsEntry = require('../models/SavingsEntry');
const Wallet = require('../models/Wallet');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const pick = require('../utils/pick');
const { round2, peso } = require('../utils/money');
const { todayUtc, parseDate } = require('../utils/dates');
const { balanceOf } = require('../utils/balances');

const FIELDS = ['title', 'targetAmount', 'deadline'];

// Derived progress numbers, computed on every read instead of being stored.
function describeGoal(goal) {
  const o = goal.toObject ? goal.toObject() : goal;
  const remaining = round2(Math.max(0, o.targetAmount - o.savedAmount));
  const percent = round2(Math.min(100, (o.savedAmount / o.targetAmount) * 100));
  let daysLeft = null;
  let overdue = false;
  let suggestedMonthly = null;
  if (o.deadline) {
    daysLeft = Math.ceil((o.deadline - todayUtc()) / 86400000);
    overdue = o.status !== 'Completed' && daysLeft < 0;
    if (o.status !== 'Completed' && daysLeft >= 0) {
      const monthsLeft = Math.max(1, Math.ceil(daysLeft / 30)); // at least one month so we never divide by zero
      suggestedMonthly = round2(remaining / monthsLeft);
    }
  }
  return { ...o, remaining, percent, daysLeft, overdue, suggestedMonthly };
}
exports.describeGoal = describeGoal;

const parseAmount = (value) => {
  const amount = Number(value);
  if (value === undefined || value === null || value === '' || Number.isNaN(amount) || amount <= 0) {
    throw new ApiError(400, 'Amount must be a number greater than 0', { amount: 'Enter an amount greater than 0' });
  }
  return round2(amount);
};

const mustHaveFutureDeadline = (deadline) => {
  if (deadline && parseDate(deadline, 'Deadline') < todayUtc()) {
    throw new ApiError(400, 'Deadline cannot be in the past', { deadline: 'Pick today or a future date' });
  }
};

// GET /api/savings-goals
exports.list = asyncHandler(async (req, res) => {
  const goals = await SavingsGoal.find().sort({ createdAt: -1 });
  res.json(goals.map(describeGoal));
});

// GET /api/savings-goals/:id
exports.getOne = asyncHandler(async (req, res) => {
  const goal = await SavingsGoal.findById(req.params.id);
  if (!goal) throw new ApiError(404, 'Savings goal not found');
  res.json(describeGoal(goal));
});

// POST /api/savings-goals  (savedAmount always starts at 0; money gets in through /deposit)
exports.create = asyncHandler(async (req, res) => {
  const body = pick(req.body, FIELDS);
  if (body.deadline === '') body.deadline = null;
  mustHaveFutureDeadline(body.deadline);
  res.status(201).json(describeGoal(await SavingsGoal.create(body)));
});

// PUT /api/savings-goals/:id
exports.update = asyncHandler(async (req, res) => {
  const goal = await SavingsGoal.findById(req.params.id);
  if (!goal) throw new ApiError(404, 'Savings goal not found');
  const changes = pick(req.body, FIELDS);
  if (changes.deadline === '') changes.deadline = null;
  if (changes.deadline && String(new Date(changes.deadline)) !== String(goal.deadline)) mustHaveFutureDeadline(changes.deadline);
  goal.set(changes);
  await goal.validate();
  if (goal.targetAmount < goal.savedAmount) {
    throw new ApiError(400, `Target cannot be lower than the ${peso(goal.savedAmount)} already saved`, { targetAmount: `Must be at least ${peso(goal.savedAmount)}` });
  }
  goal.status = goal.savedAmount >= goal.targetAmount ? 'Completed' : 'Active';
  await goal.save();
  res.json(describeGoal(goal));
});

// DELETE /api/savings-goals/:id -> money inside must be moved back first so it is never lost
exports.remove = asyncHandler(async (req, res) => {
  const goal = await SavingsGoal.findById(req.params.id);
  if (!goal) throw new ApiError(404, 'Savings goal not found');
  if (goal.savedAmount > 0) throw new ApiError(400, `Withdraw the ${peso(goal.savedAmount)} saved in this goal back to a wallet before deleting it`);
  await SavingsEntry.deleteMany({ goal: goal._id });
  await goal.deleteOne();
  res.json({ message: `${goal.title} deleted` });
});

// POST /api/savings-goals/:id/deposit   { wallet, amount }  wallet -> goal
exports.deposit = asyncHandler(async (req, res) => {
  const goal = await SavingsGoal.findById(req.params.id);
  if (!goal) throw new ApiError(404, 'Savings goal not found');
  const amount = parseAmount(req.body.amount);
  const wallet = await Wallet.findById(req.body.wallet);
  if (!wallet) throw new ApiError(400, 'Select a wallet to take the money from', { wallet: 'Wallet does not exist' });

  const available = await balanceOf(wallet._id);
  if (amount > available) throw new ApiError(400, `Amount cannot exceed the ${peso(available)} available in ${wallet.name}`, { amount: `Maximum ${peso(available)}` });
  const room = round2(goal.targetAmount - goal.savedAmount);
  if (amount > room) throw new ApiError(400, room === 0 ? 'This goal is already fully funded' : `Amount cannot exceed the goal target. Only ${peso(room)} more is needed`, { amount: `Maximum ${peso(room)}` });

  const entry = await SavingsEntry.create({ goal: goal._id, wallet: wallet._id, kind: 'Deposit', amount });
  goal.savedAmount = round2(goal.savedAmount + amount);
  goal.status = goal.savedAmount >= goal.targetAmount ? 'Completed' : 'Active';
  await goal.save();
  res.status(201).json({ goal: describeGoal(goal), entry, walletBalance: await balanceOf(wallet._id) });
});

// POST /api/savings-goals/:id/withdraw   { wallet, amount }  goal -> wallet
exports.withdraw = asyncHandler(async (req, res) => {
  const goal = await SavingsGoal.findById(req.params.id);
  if (!goal) throw new ApiError(404, 'Savings goal not found');
  const amount = parseAmount(req.body.amount);
  const wallet = await Wallet.findById(req.body.wallet);
  if (!wallet) throw new ApiError(400, 'Select a wallet to receive the money', { wallet: 'Wallet does not exist' });
  if (amount > goal.savedAmount) throw new ApiError(400, `Amount cannot exceed the ${peso(goal.savedAmount)} saved in this goal`, { amount: `Maximum ${peso(goal.savedAmount)}` });

  const entry = await SavingsEntry.create({ goal: goal._id, wallet: wallet._id, kind: 'Withdraw', amount });
  goal.savedAmount = round2(goal.savedAmount - amount);
  goal.status = 'Active'; // below target again
  await goal.save();
  res.status(201).json({ goal: describeGoal(goal), entry, walletBalance: await balanceOf(wallet._id) });
});

// GET /api/savings-goals/:id/entries -> deposit / withdraw history of one goal
exports.entries = asyncHandler(async (req, res) => {
  const goal = await SavingsGoal.findById(req.params.id);
  if (!goal) throw new ApiError(404, 'Savings goal not found');
  res.json(await SavingsEntry.find({ goal: goal._id }).sort({ createdAt: -1 }).populate('wallet', 'name color'));
});
