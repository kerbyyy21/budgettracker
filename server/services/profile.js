const Profile = require('../models/Profile');

// Single-user app: there is one profile document. Create a default one on first use.
async function ensureProfile() {
  let profile = await Profile.findOne();
  if (!profile) profile = await Profile.create({ name: 'BudgetTracker User', email: 'user@BudgetTracker.app' });
  return profile;
}

module.exports = { ensureProfile };
