const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/HttpError');
const { pick, escapeRegex } = require('../utils/query');

const FIELDS = ['name', 'type', 'icon', 'color'];

// GET /api/categories?type=Expense  — each category includes how many transactions use it
exports.list = asyncHandler(async (req, res) => {
  const { type } = req.query;
  if (type && !['Income', 'Expense'].includes(type)) throw new HttpError(400, 'type must be Income or Expense');
  const [data, usage] = await Promise.all([
    Category.find(type ? { type } : {}).sort({ type: -1, isDefault: -1, name: 1 }).lean(),
    Transaction.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
  ]);
  const counts = new Map(usage.map((u) => [String(u._id), u.count]));
  res.json({ data: data.map((c) => ({ ...c, transactionCount: counts.get(String(c._id)) ?? 0 })) });
});

// GET /api/categories/:id
exports.getOne = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id).lean();
  if (!category) throw new HttpError(404, 'Category not found');
  res.json(category);
});

async function assertUniqueName(name, type, ignoreId) {
  const clash = await Category.findOne({
    name: new RegExp(`^${escapeRegex(name.trim())}$`, 'i'),
    type,
    ...(ignoreId && { _id: { $ne: ignoreId } }),
  }).lean();
  if (clash) throw new HttpError(409, `A ${type} category named "${clash.name}" already exists`);
}

// POST /api/categories
exports.create = asyncHandler(async (req, res) => {
  const category = new Category(pick(req.body, FIELDS));
  await category.validate();
  await assertUniqueName(category.name, category.type);
  await category.save();
  res.status(201).json(category);
});

// PUT /api/categories/:id
exports.update = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new HttpError(404, 'Category not found');
  if (category.isDefault) throw new HttpError(403, 'Default categories cannot be edited');

  const usage = await Transaction.countDocuments({ category: category._id });
  if (usage > 0 && req.body.type && req.body.type !== category.type) {
    throw new HttpError(409, 'Cannot change the type of a category that already has transactions');
  }

  category.set(pick(req.body, FIELDS));
  await category.validate();
  await assertUniqueName(category.name, category.type, category._id);
  await category.save();
  res.json(category);
});

// DELETE /api/categories/:id
exports.remove = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new HttpError(404, 'Category not found');
  if (category.isDefault) throw new HttpError(403, 'Default categories cannot be deleted');

  const used = await Transaction.countDocuments({ category: category._id });
  if (used > 0) throw new HttpError(409, `This category is used by ${used} transaction${used > 1 ? 's' : ''}. Reassign them first.`);

  await category.deleteOne();
  res.json({ message: 'Category deleted', id: req.params.id });
});
