const mongoose = require('mongoose');
const { HEX_COLOR } = require('../constants');

const round2 = (v) => Math.round(v * 100) / 100;

const savingsGoalSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true, unique: true, minlength: [2, 'Title must be at least 2 characters'], maxlength: [60, 'Title must be at most 60 characters'] },
    targetAmount: { type: Number, required: [true, 'Target amount is required'], min: [1, 'Target amount must be at least 1'], max: [100000000, 'Target amount is too large'], set: round2 },
    savedAmount: { type: Number, default: 0, min: [0, 'Saved amount cannot be negative'], set: round2 },
    targetDate: { type: Date, default: null },
    color: { type: String, default: '#2563eb', match: [HEX_COLOR, 'Color must be a hex value like #2563eb'] },
  },
  { timestamps: true }
);

savingsGoalSchema.path('savedAmount').validate(function (v) {
  return v <= this.targetAmount + 0.001;
}, 'Saved amount cannot exceed the target amount');

module.exports = mongoose.model('SavingsGoal', savingsGoalSchema);
