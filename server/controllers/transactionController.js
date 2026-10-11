const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const Wallet = require('../models/Wallet');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/HttpError');
const { escapeRegex, objectId, pick } = require('../utils/query');
const { isValidMonthKey, monthRange, round2 } = require('../services/finance');
const { assertNoOverdraft } = require('../services/ledger');

const FIELDS = ['type', 'amount', 'category', 'wallet', 'paymentMethod', 'note', 'date'];
const POPULATE = [
  { path: 'category', select: 'name type icon color' },
  { path: 'wallet', select: 'name type color' },
];

// GET /api/transactions  — multi-criteria search, filter, sort and pagination
exports.list = asyncHandler(async (req, res) => {
  const { type, category, wallet, paymentMethod, month, from, to, minAmount, maxAmount, q } = req.query;
  const sortField = req.query.sort ?? 'date';
  const dir = (req.query.order ?? 'desc') === 'asc' ? 1 : -1;
  const page = Math.max(1, parseInt(req.query.page ?? '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit ?? '20', 10) || 20));

  if (!['date', 'amount'].includes(sortField)) throw new HttpError(400, 'sort must be "date" or "amount"');
  if (type && !['Income', 'Expense'].includes(type)) throw new HttpError(400, 'type must be Income or Expense');

  const filter = {};
  if (type) filter.type = type;
  if (category) filter.category = objectId(category, 'category');
  if (wallet) filter.wallet = objectId(wallet, 'wallet');
  if (paymentMethod) filter.paymentMethod = paymentMethod;

  const date = {};
  if (month) {
    if (!isValidMonthKey(month)) throw new HttpError(400, 'month must look like 2026-10');
    const { start, end } = monthRange(month);
    date.$gte = start;
    date.$lt = end;
  }
  if (from) {
    const d = new Date(from);
    if (Number.isNaN(d.getTime())) throw new HttpError(400, 'from is not a valid date');
    date.$gte = date.$gte && date.$gte > d ? date.$gte : d;
  }
  if (to) {
    const d = new Date(to);
    if (Number.isNaN(d.getTime())) throw new HttpError(400, 'to is not a valid date');
    d.setUTCHours(23, 59, 59, 999);
    date.$lte = d;
  }
  if (Object.keys(date).length) filter.date = date;

  const amount = {};
  if (minAmount !== undefined && minAmount !== '') {
    if (!Number.isFinite(Number(minAmount))) throw new HttpError(400, 'minAmount must be a number');
    amount.$gte = Number(minAmount);
  }
  if (maxAmount !== undefined && maxAmount !== '') {
    if (!Number.isFinite(Number(maxAmount))) throw new HttpError(400, 'maxAmount must be a number');
    amount.$lte = Number(maxAmount);
  }
  if (Object.keys(amount).length) filter.amount = amount;

  if (q && q.trim()) {
    const rx = new RegExp(escapeRegex(q.trim()), 'i');
    const matchingCategories = await Category.find({ name: rx }).select('_id').lean();
    filter.$or = [{ note: rx }, { category: { $in: matchingCategories.map((c) => c._id) } }];
  }

  const [data, total, totals] = await Promise.all([
    Transaction.find(filter)
      .sort({ [sortField]: dir, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(POPULATE)
      .lean(),
    Transaction.countDocuments(filter),
    Transaction.aggregate([{ $match: filter }, { $group: { _id: '$type', total: { $sum: '$amount' } } }]),
  ]);

  const income = round2(totals.find((t) => t._id === 'Income')?.total ?? 0);
  const expenses = round2(totals.find((t) => t._id === 'Expense')?.total ?? 0);

  res.json({
    data,
    pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
    totals: { income, expenses, net: round2(income - expenses) },
  });
});

// GET /api/transactions/:id
exports.getOne = asyncHandler(async (req, res) => {
  const tx = await Transaction.findById(req.params.id).populate(POPULATE).lean();
  if (!tx) throw new HttpError(404, 'Transaction not found');
  res.json(tx);
});

async function assertReferences(tx) {
  const [category, wallet] = await Promise.all([Category.findById(tx.category).lean(), Wallet.findById(tx.wallet).lean()]);
  if (!category) throw new HttpError(400, 'Validation failed', { category: 'Category does not exist' });
  if (!wallet) throw new HttpError(400, 'Validation failed', { wallet: 'Wallet does not exist' });
  if (category.type !== tx.type) {
    throw new HttpError(400, 'Validation failed', { category: `"${category.name}" is an ${category.type} category, not ${tx.type}` });
  }
}

// POST /api/transactions
exports.create = asyncHandler(async (req, res) => {
  const tx = new Transaction(pick(req.body, FIELDS));
  await tx.validate();
  await assertReferences(tx);
  await assertNoOverdraft({ added: { wallet: tx.wallet, type: tx.type, amount: tx.amount } });
  await tx.save();
  res.status(201).json(await Transaction.findById(tx._id).populate(POPULATE).lean());
});

// PUT /api/transactions/:id
exports.update = asyncHandler(async (req, res) => {
  const tx = await Transaction.findById(req.params.id);
  if (!tx) throw new HttpError(404, 'Transaction not found');

  const before = { wallet: tx.wallet, type: tx.type, amount: tx.amount };
  tx.set(pick(req.body, FIELDS));
  await tx.validate();
  await assertReferences(tx);
  await assertNoOverdraft({ removed: before, added: { wallet: tx.wallet, type: tx.type, amount: tx.amount } });
  await tx.save();
  res.json(await Transaction.findById(tx._id).populate(POPULATE).lean());
});

// DELETE /api/transactions/:id
exports.remove = asyncHandler(async (req, res) => {
  const tx = await Transaction.findById(req.params.id);
  if (!tx) throw new HttpError(404, 'Transaction not found');
  await assertNoOverdraft({ removed: { wallet: tx.wallet, type: tx.type, amount: tx.amount } });
  await tx.deleteOne();
  res.json({ message: 'Transaction deleted', id: req.params.id });
});
