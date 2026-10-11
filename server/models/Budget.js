const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    month: { type: String, required: [true, 'Month is required'], unique: true, match: [/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must look like 2026-10'] },
    monthlyLimit: {
      type: Number, required: [true, 'Monthly limit is required'],
      min: [1, 'Monthly limit must be at least 1'], max: [100000000, 'Monthly limit is too large'],
      set: (v) => Math.round(v * 100) / 100,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Budget', budgetSchema);
