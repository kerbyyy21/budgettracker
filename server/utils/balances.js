const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const SavingsEntry = require('../models/SavingsEntry');
const { round2 } = require('./money');

const oid = (id) => new mongoose.Types.ObjectId(String(id));

// Wallet balance = starting balance + income - expenses - money moved into goals + money taken back from goals.
// Returns a Map<walletId, { income, expense, deposited, withdrawn, balance }> for the given wallets.
async function computeBalances(wallets, { excludeTransactionId } = {}) {
  const ids = wallets.map((w) => w._id);
  const txMatch = { wallet: { $in: ids } };
  if (excludeTransactionId) txMatch._id = { $ne: oid(excludeTransactionId) };

  const [txSums, entrySums] = await Promise.all([
    Transaction.aggregate([
      { $match: txMatch },
      { $group: { _id: { wallet: '$wallet', type: '$type' }, total: { $sum: '$amount' } } },
    ]),
    SavingsEntry.aggregate([
      { $match: { wallet: { $in: ids } } },
      { $group: { _id: { wallet: '$wallet', kind: '$kind' }, total: { $sum: '$amount' } } },
    ]),
  ]);

  const map = new Map(
    wallets.map((w) => [String(w._id), { income: 0, expense: 0, deposited: 0, withdrawn: 0, balance: w.initialBalance }])
  );
  txSums.forEach((s) => {
    const row = map.get(String(s._id.wallet));
    if (row) row[s._id.type === 'Income' ? 'income' : 'expense'] = s.total;
  });
  entrySums.forEach((s) => {
    const row = map.get(String(s._id.wallet));
    if (row) row[s._id.kind === 'Deposit' ? 'deposited' : 'withdrawn'] = s.total;
  });
  wallets.forEach((w) => {
    const row = map.get(String(w._id));
    row.balance = round2(w.initialBalance + row.income - row.expense - row.deposited + row.withdrawn);
    row.income = round2(row.income);
    row.expense = round2(row.expense);
  });
  return map;
}

async function balanceOf(walletId, options) {
  const wallet = await Wallet.findById(walletId);
  if (!wallet) return null;
  const map = await computeBalances([wallet], options);
  return map.get(String(wallet._id)).balance;
}

module.exports = { computeBalances, balanceOf };
