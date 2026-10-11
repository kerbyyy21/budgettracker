const mongoose = require('mongoose');
const { TRANSACTION_TYPES, CATEGORY_ICONS, HEX_COLOR } = require('../constants');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Category name is required'], trim: true, minlength: [2, 'Category name must be at least 2 characters'], maxlength: [30, 'Category name must be at most 30 characters'] },
    type: { type: String, required: [true, 'Type is required'], enum: { values: TRANSACTION_TYPES, message: 'Type must be Income or Expense' } },
    icon: { type: String, enum: { values: CATEGORY_ICONS, message: 'Unknown icon' }, default: 'tag' },
    color: { type: String, default: '#0f766e', match: [HEX_COLOR, 'Color must be a hex value like #0f766e'] },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// A name may exist once per type (e.g. "Savings" as both Income and Expense is fine).
categorySchema.index({ name: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
