const Profile = require('../models/Profile');
const Wallet = require('../models/Wallet');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/HttpError');
const { pick } = require('../utils/query');
const { ensureProfile } = require('../services/profile');
const { PLAN_CATALOG, planPrice, yearlySavings, subscriptionInfo } = require('../services/finance');

const TRIAL_DAYS = 7;

async function present(profile) {
  const walletsUsed = await Wallet.countDocuments();
  return { ...profile.toObject(), subscription: { ...subscriptionInfo(profile), walletsUsed } };
}

// GET /api/profile
exports.get = asyncHandler(async (req, res) => {
  res.json(await present(await ensureProfile()));
});

// PUT /api/profile
exports.update = asyncHandler(async (req, res) => {
  const profile = await ensureProfile();
  profile.set(pick(req.body, ['name', 'email']));
  await profile.save();
  res.json(await present(profile));
});

// GET /api/profile/plans  — plan catalogue with prices and yearly savings
exports.plans = asyncHandler(async (req, res) => {
  const profile = await ensureProfile();
  res.json({
    current: { plan: profile.plan, billingCycle: profile.billingCycle },
    trialAvailable: !profile.trialUsed,
    trialDays: TRIAL_DAYS,
    data: Object.values(PLAN_CATALOG).map((p) => ({ ...p, yearlySavings: yearlySavings(p.name) })),
  });
});

// POST /api/profile/subscribe  — change plan; first paid plan starts a 7-day trial
exports.subscribe = asyncHandler(async (req, res) => {
  const { plan, billingCycle = 'monthly' } = req.body;
  if (!PLAN_CATALOG[plan]) throw new HttpError(400, 'Validation failed', { plan: 'Plan must be Basic, Plus or Premium' });
  if (!['monthly', 'yearly'].includes(billingCycle)) {
    throw new HttpError(400, 'Validation failed', { billingCycle: 'Billing cycle must be monthly or yearly' });
  }

  const profile = await ensureProfile();
  const sameCycle = plan === 'Basic' || profile.billingCycle === billingCycle;
  if (profile.plan === plan && sameCycle) throw new HttpError(400, `You are already on the ${plan} plan`);

  const limit = PLAN_CATALOG[plan].walletLimit;
  const wallets = await Wallet.countDocuments();
  if (limit !== null && wallets > limit) {
    throw new HttpError(400, `You have ${wallets} wallets but ${plan} allows ${limit}. Delete ${wallets - limit} first.`);
  }

  const now = new Date();
  const startsTrial = plan !== 'Basic' && profile.plan === 'Basic' && !profile.trialUsed;
  profile.plan = plan;
  profile.billingCycle = plan === 'Basic' ? 'monthly' : billingCycle;
  profile.planStartedAt = now;
  profile.trialEndsAt = startsTrial ? new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000) : null;
  if (startsTrial) profile.trialUsed = true;
  await profile.save();

  res.json({
    ...(await present(profile)),
    message: startsTrial
      ? `${plan} trial started. ${TRIAL_DAYS} days free, then ₱${planPrice(plan, profile.billingCycle)}/${profile.billingCycle === 'yearly' ? 'yr' : 'mo'}.`
      : `You are now on the ${plan} plan.`,
  });
});
