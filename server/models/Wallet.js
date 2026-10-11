const mongoose = require('mongoose');
const { WALLET_TYPES, HEX_COLOR } = require('../constants');

const walletSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Wallet name is required'], trim: true, unique: true, minlength: [1, 'Wallet name is required'], maxlength: [30, 'Wallet name must be at most 30 characters'] },
    type: { type: String, enum: { values: WALLET_TYPES, message: 'Type must be Cash, Digital Wallet or Bank' }, default: 'Cash' },
    initialBalance: { type: Number, default: 0, min: [0, 'Starting balance cannot be negative'], max: [100000000, 'Starting balance is too large'], set: (v) => Math.round(v * 100) / 100 },
    color: { type: String, default: '#0f766e', match: [HEX_COLOR, 'Color must be a hex value like #0f766e'] },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Wallet', walletSchema);
