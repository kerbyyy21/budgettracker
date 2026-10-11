const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/HttpError');
const { pick } = require('../utils/query');
const { walletBalances, availableToSave, peso } = require('../services/ledger');
const { ensureProfile } = require('../services/profile');
const { PLAN_CATALOG, walletAllowed, round2 } = require('../services/finance');

const withStats = (row) => ({ ...row.wallet, income: row.income, expenses: row.expenses, balance: row.balance });

// GET /api/wallets  — each wallet with its computed balance
exports.list = asyncHandler(async (req, res) => {
  const [balances, profile] = await Promise.all([walletBalances(), ensureProfile()]);
  const data = [...balances.values()].map(withStats);
  res.json({
    data,
    totalBalance: round2(data.reduce((s, w) => s + w.balance, 0)),
    plan: profile.plan,
    walletLimit: PLAN_CATALOG[profile.plan].walletLimit,
    canAddMore: walletAllowed(profile.plan, data.length),
  });
});

// GET /api/wallets/:id
exports.getOne = asyncHandler(async (req, res) => {
  const row = (await walletBalances()).get(req.params.id);
  if (!row) throw new HttpError(404, 'Wallet not found');
  const transactionCount = await Transaction.countDocuments({ wallet: req.params.id });
  res.json({ ...withStats(row), transactionCount });
});

// POST /api/wallets  — enforces the wallet limit of the current subscription plan
exports.create = asyncHandler(async (req, res) => {
  const wallet = new Wallet(pick(req.body, ['name', 'type', 'initialBalance', 'color']));
  await wallet.validate();

  const [profile, count] = await Promise.all([ensureProfile(), Wallet.countDocuments()]);
  if (!walletAllowed(profile.plan, count)) {
    const limit = PLAN_CATALOG[profile.plan].walletLimit;
    throw new HttpError(403, `Your ${profile.plan} plan allows up to ${limit} wallet${limit > 1 ? 's' : ''}. Upgrade to add more.`);
  }

  await wallet.save();
  res.status(201).json(wallet);
});

// PUT /api/wallets/:id
exports.update = asyncHandler(async (req, res) => {
  const wallet = await Wallet.findById(req.params.id);
  if (!wallet) throw new HttpError(404, 'Wallet not found');

  wallet.set(pick(req.body, ['name', 'type', 'initialBalance', 'color']));
  await wallet.validate();

  if (wallet.isModified('initialBalance')) {
    const row = (await walletBalances()).get(req.params.id);
    const newBalance = round2(wallet.initialBalance + row.income - row.expenses);
    if (newBalance < 0) {
      throw new HttpError(400, 'Validation failed', { initialBalance: `Would leave the wallet at ${peso(newBalance)} after its transactions` });
    }
    const { available } = await availableToSave();
    if (round2(available + (wallet.initialBalance - row.wallet.initialBalance)) < 0) {
      throw new HttpError(400, 'Validation failed', { initialBalance: 'Would use money set aside for savings goals' });
    }
  }

  await wallet.save();
  res.json(wallet);
});

// DELETE /api/wallets/:id
exports.remove = asyncHandler(async (req, res) => {
  const wallet = await Wallet.findById(req.params.id);
  if (!wallet) throw new HttpError(404, 'Wallet not found');
  if (wallet.isDefault) throw new HttpError(403, 'The default wallet cannot be deleted');

  const used = await Transaction.countDocuments({ wallet: wallet._id });
  if (used > 0) throw new HttpError(409, `This wallet has ${used} transaction${used > 1 ? 's' : ''}. Delete or move them first.`);

  const row = (await walletBalances()).get(String(wallet._id));
  const { available } = await availableToSave();
  if (round2(available - row.balance) < 0) {
    throw new HttpError(400, 'Deleting this wallet would use money set aside for savings goals');
  }

  await wallet.deleteOne();
  res.json({ message: 'Wallet deleted', id: req.params.id });
});
