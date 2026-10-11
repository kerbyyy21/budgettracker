const Subscription = require('../models/Subscription');
const { PLANS } = require('./plans');

// The stored status can be stale (a trial ends by itself as time passes), so we derive the real status on read.
function describe(sub, now = new Date()) {
  const o = sub.toObject ? sub.toObject() : { ...sub };
  let status = o.status;
  if (status === 'Trial' && o.trialEndsAt && now >= o.trialEndsAt) status = 'Active'; // trial converted
  if (['Trial', 'Active', 'Cancelled'].includes(status) && o.renewsAt && now >= o.renewsAt) status = 'Expired';
  const hasAccess = ['Trial', 'Active', 'Cancelled'].includes(status); // cancelled keeps access until period end
  const daysLeft = o.renewsAt && hasAccess ? Math.max(0, Math.ceil((o.renewsAt - now) / 86400000)) : 0;
  const trialDaysLeft = status === 'Trial' && o.trialEndsAt ? Math.max(0, Math.ceil((o.trialEndsAt - now) / 86400000)) : 0;
  return { ...o, effectiveStatus: status, hasAccess, daysLeft, trialDaysLeft };
}

// Returns the plan the user is on right now + its limits. No subscription => Free.
async function currentPlan() {
  const latest = await Subscription.find().sort({ createdAt: -1 }).limit(10);
  const live = latest.map((s) => describe(s)).find((s) => s.hasAccess);
  const plan = live ? live.plan : 'Free';
  return { plan, limits: PLANS[plan], subscription: live || null };
}

module.exports = { describe, currentPlan };
