const mongoose = require('mongoose');
const { PLANS, BILLING_CYCLES } = require('../constants');

const profileSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, minlength: [2, 'Name must be at least 2 characters'], maxlength: [60, 'Name must be at most 60 characters'] },
    email: {
      type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email is not valid'],
    },
    plan: { type: String, enum: { values: PLANS, message: 'Plan must be Basic, Plus or Premium' }, default: 'Basic' },
    billingCycle: { type: String, enum: { values: BILLING_CYCLES, message: 'Billing cycle must be monthly or yearly' }, default: 'monthly' },
    planStartedAt: { type: Date, default: Date.now },
    trialEndsAt: { type: Date, default: null },
    trialUsed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Profile', profileSchema);
