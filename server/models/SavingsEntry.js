const mongoose = require('mongoose');

// Ledger of deposits to / withdrawals from a savings goal.
const savingsEntrySchema = new mongoose.Schema(
  {
    goal: { type: mongoose.Schema.Types.ObjectId, ref: 'SavingsGoal', required: [true, 'Goal is required'] },
    type: { type: String, required: true, enum: { values: ['Deposit', 'Withdrawal'], message: 'Type must be Deposit or Withdrawal' } },
    amount: { type: Number, required: [true, 'Amount is required'], min: [0.01, 'Amount must be greater than zero'], set: (v) => Math.round(v * 100) / 100 },
    note: { type: String, trim: true, maxlength: [120, 'Note must be at most 120 characters'], default: '' },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

savingsEntrySchema.index({ goal: 1, date: -1 });

module.exports = mongoose.model('SavingsEntry', savingsEntrySchema);
