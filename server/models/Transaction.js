const mongoose = require('mongoose');
const { TRANSACTION_TYPES, PAYMENT_METHODS } = require('../constants');

const DAY_MS = 24 * 60 * 60 * 1000;

const transactionSchema = new mongoose.Schema(
  {
    type: { type: String, required: [true, 'Type is required'], enum: { values: TRANSACTION_TYPES, message: 'Type must be Income or Expense' } },
    amount: {
      type: Number, required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than zero'], max: [100000000, 'Amount is too large'],
      set: (v) => Math.round(v * 100) / 100,
    },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: [true, 'Category is required'] },
    wallet: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet', required: [true, 'Wallet is required'] },
    paymentMethod: { type: String, enum: { values: PAYMENT_METHODS, message: 'Unknown payment method' }, default: 'Cash' },
    note: { type: String, trim: true, maxlength: [200, 'Note must be at most 200 characters'], default: '' },
    date: {
      type: Date, required: [true, 'Date is required'], default: Date.now,
      validate: { validator: (v) => v.getTime() <= Date.now() + DAY_MS, message: 'Date cannot be in the future' },
    },
  },
  { timestamps: true }
);

transactionSchema.index({ date: -1 });
transactionSchema.index({ wallet: 1 });
transactionSchema.index({ category: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
