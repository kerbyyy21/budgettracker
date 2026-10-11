// Database-backed money helpers shared by controllers.
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const SavingsGoal = require('../models/SavingsGoal');
const HttpError = require('../utils/HttpError');
const { round2, signed } = require('./finance');

const peso = (n) => `₱${round2(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Map<walletId, { wallet, income, expenses, balance }>
async function walletBalances() {
  const [wallets, totals] = await Promise.all([
    Wallet.find().sort({ createdAt: 1 }).lean(),
    Transaction.aggregate([{ $group: { _id: { wallet: '$wallet', type: '$type' }, total: { $sum: '$amount' } } }]),
  ]);

  const map = new Map();
  for (const w of wallets) map.set(String(w._id), { wallet: w, income: 0, expenses: 0, balance: w.initialBalance });
  for (const t of totals) {
    const row = map.get(String(t._id.wallet));
    if (!row) continue;
    if (t._id.type === 'Income') row.income = round2(t.total);
    else row.expenses = round2(t.total);
  }
  for (const row of map.values()) row.balance = round2(row.wallet.initialBalance + row.income - row.expenses);
  return map;
}

async function totalSaved() {
  const [row] = await SavingsGoal.aggregate([{ $group: { _id: null, total: { $sum: '$savedAmount' } } }]);
  return round2(row?.total ?? 0);
}

// Money that is free to spend or to put into a goal.
async function availableToSave() {
  const [balances, saved] = await Promise.all([walletBalances(), totalSaved()]);
  const total = round2([...balances.values()].reduce((s, r) => s + r.balance, 0));
  return { totalBalance: total, totalSaved: saved, available: round2(total - saved) };
}

// Rejects a change that would overdraw a wallet or eat into money set aside for goals.
// `removed` / `added` are plain transaction objects ({ wallet, type, amount }) or null.
async function assertNoOverdraft({ removed = null, added = null }) {
  const balances = await walletBalances();
  const delta = new Map();
  const apply = (tx, sign) => {
    if (!tx) return;
    const key = String(tx.wallet);
    delta.set(key, round2((delta.get(key) ?? 0) + signed(tx) * sign));
  };
  apply(removed, -1);
  apply(added, +1);

  let totalDelta = 0;
  for (const [key, d] of delta) {
    totalDelta += d;
    const row = balances.get(key);
    if (!row) continue;
    if (d < 0 && round2(row.balance + d) < 0) {
      throw new HttpError(400, `Insufficient balance in "${row.wallet.name}" (${peso(row.balance)} available)`);
    }
  }

  if (totalDelta < 0) {
    const { available } = await availableToSave();
    if (round2(available + totalDelta) < 0) {
      throw new HttpError(400, `This would use money set aside for savings goals (only ${peso(available)} is free to use)`);
    }
  }
}

module.exports = { peso, walletBalances, totalSaved, availableToSave, assertNoOverdraft };
