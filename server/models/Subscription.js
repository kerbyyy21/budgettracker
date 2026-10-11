const mongoose = require('mongoose');

// Status flow: Trial -> Active -> Cancelled   (Trial/Active -> Expired automatically by date)
const subscriptionSchema = new mongoose.Schema(
  {
    plan: { type: String, required: [true, 'Plan is required'], enum: { values: ['Free', 'Plus', 'Premium'], message: '{VALUE} is not a valid plan' } },
    billingCycle: { type: String, enum: ['Monthly', 'Yearly'], default: 'Monthly' },
    status: { type: String, enum: ['Trial', 'Active', 'Cancelled', 'Expired'], default: 'Trial' },
    price: { type: Number, min: 0, default: 0 },
    startedAt: { type: Date, default: Date.now },
    trialEndsAt: { type: Date, default: null },
    renewsAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subscription', subscriptionSchema);
