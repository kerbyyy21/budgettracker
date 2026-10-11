// Shared enums used by models, controllers and the seed script.
module.exports = {
  TRANSACTION_TYPES: ['Income', 'Expense'],
  PAYMENT_METHODS: ['Cash', 'GCash', 'Maya', 'Bank Transfer', 'Card'],
  WALLET_TYPES: ['Cash', 'Digital Wallet', 'Bank'],
  PLANS: ['Basic', 'Plus', 'Premium'],
  BILLING_CYCLES: ['monthly', 'yearly'],
  CATEGORY_ICONS: [
    'utensils', 'bus', 'graduation-cap', 'smartphone', 'shopping-bag', 'receipt',
    'home', 'heart-pulse', 'clapperboard', 'triangle-alert', 'wallet', 'briefcase',
    'clock', 'store', 'gift', 'piggy-bank', 'coffee', 'car', 'plane', 'book-open',
    'dumbbell', 'paw-print', 'tag',
  ],
  HEX_COLOR: /^#([0-9a-fA-F]{6})$/,
};
