// Fills the database with realistic sample data relative to today.
// Usage: npm run seed   (this clears the existing BudgetTracker collections first)
const dns = require('node:dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Profile = require('../models/Profile');
const Wallet = require('../models/Wallet');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const SavingsGoal = require('../models/SavingsGoal');
const SavingsEntry = require('../models/SavingsEntry');
const { monthKey, shiftMonth } = require('../services/finance');

const MIN = 60 * 1000;
const DAY = 24 * 60 * MIN;
const TZ = Number(process.env.TZ_OFFSET_MINUTES ?? 480);

// Small deterministic random generator so every seed run looks the same.
function rng(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const EXPENSE_CATEGORIES = [
  ['Food', 'utensils', '#f97316'], ['Fare / Commute', 'bus', '#3b82f6'], ['School', 'graduation-cap', '#6366f1'],
  ['Load', 'smartphone', '#14b8a6'], ['Shopping', 'shopping-bag', '#ec4899'], ['Bills', 'receipt', '#7c3aed'],
  ['Rent', 'home', '#92400e'], ['Health', 'heart-pulse', '#ef4444'], ['Entertainment', 'clapperboard', '#f59e0b'],
  ['Emergency', 'triangle-alert', '#ea580c'],
];
const INCOME_CATEGORIES = [
  ['Allowance', 'wallet', '#16a34a'], ['Salary', 'briefcase', '#65a30d'], ['Part-time', 'clock', '#0891b2'],
  ['Business', 'store', '#7c3aed'], ['Gift', 'gift', '#a855f7'], ['Savings', 'piggy-bank', '#10b981'],
];

async function seedDatabase() {
  const rand = rng(2026);
  const between = (min, max) => Math.round(min + rand() * (max - min));
  const pickOne = (arr) => arr[Math.floor(rand() * arr.length)];

  await Promise.all([Profile, Wallet, Category, Transaction, Budget, SavingsGoal, SavingsEntry].map((m) => m.deleteMany({})));

  const now = new Date();
  await Profile.create({
    name: 'John Carlo', email: 'carloonlineclass@gmail.com', plan: 'Plus', billingCycle: 'monthly',
    planStartedAt: new Date(now.getTime() - 3 * DAY), trialEndsAt: new Date(now.getTime() + 4 * DAY), trialUsed: true,
  });

  const [cash, gcash, bpi] = await Wallet.insertMany([
    { name: 'Wallet', type: 'Cash', initialBalance: 1500, color: '#92400e', isDefault: true },
    { name: 'GCash', type: 'Digital Wallet', initialBalance: 800, color: '#2563eb' },
    { name: 'BPI', type: 'Bank', initialBalance: 6000, color: '#dc2626' },
  ]);

  const cats = {};
  const created = await Category.insertMany([
    ...EXPENSE_CATEGORIES.map(([name, icon, color]) => ({ name, type: 'Expense', icon, color, isDefault: true })),
    ...INCOME_CATEGORIES.map(([name, icon, color]) => ({ name, type: 'Income', icon, color, isDefault: true })),
  ]);
  created.forEach((c) => { cats[`${c.type}:${c.name}`] = c; });
  const exp = (n) => cats[`Expense:${n}`];
  const inc = (n) => cats[`Income:${n}`];

  const methodFor = (w) => (w === cash ? 'Cash' : w === gcash ? 'GCash' : 'Bank Transfer');
  const balance = new Map([[String(cash._id), 1500], [String(gcash._id), 800], [String(bpi._id), 6000]]);
  const txs = [];

  // `d` is the local calendar day; time of day is random but never later than "now".
  const at = (d, hour) => {
    const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), hour, between(0, 59)) - TZ * MIN);
    return t.getTime() > now.getTime() ? new Date(now.getTime() - 5 * MIN) : t;
  };
  const income = (d, hour, category, wallet, amount, note) => {
    balance.set(String(wallet._id), balance.get(String(wallet._id)) + amount);
    txs.push({ type: 'Income', amount, category: category._id, wallet: wallet._id, paymentMethod: methodFor(wallet), note, date: at(d, hour) });
  };
  // Expenses are only created when the chosen wallet can afford them (so balances never go negative).
  const expense = (d, hour, category, wallets, amount, note) => {
    const w = wallets.find((x) => balance.get(String(x._id)) >= amount);
    if (!w) return;
    balance.set(String(w._id), balance.get(String(w._id)) - amount);
    txs.push({ type: 'Expense', amount, category: category._id, wallet: w._id, paymentMethod: methodFor(w), note, date: at(d, hour) });
  };

  const localNow = new Date(now.getTime() + TZ * MIN);
  const today = Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth(), localNow.getUTCDate());
  const startKey = shiftMonth(monthKey(now), -5);
  const first = Date.UTC(Number(startKey.slice(0, 4)), Number(startKey.slice(5)) - 1, 1);

  const foods = ['Lunch at canteen', 'Milk tea', 'Jollibee', 'Dinner', 'Breakfast', 'Groceries', 'Street food', 'Coffee'];
  for (let t = first; t <= today; t += DAY) {
    const d = new Date(t);
    const dom = d.getUTCDate();
    const dow = d.getUTCDay();

    if (dom === 1) income(d, 8, inc('Allowance'), bpi, 8000, 'Monthly allowance');
    if (dom === 15) income(d, 18, inc('Part-time'), gcash, 4500, 'Part-time pay');
    if (dow === 1) income(d, 7, inc('Allowance'), cash, 1000, 'Weekly pocket money');
    if (rand() < 0.02) income(d, 12, inc('Gift'), cash, between(2, 8) * 100, 'Gift from relatives');

    if (dom === 2) expense(d, 9, exp('Rent'), [bpi], 2000, 'Boarding house');
    if (dom === 3) expense(d, 10, exp('School'), [bpi, gcash], between(9, 14) * 100, 'Project materials and printing');
    if (dom === 5) expense(d, 20, exp('Bills'), [gcash, bpi], between(5, 8) * 100, 'Electric and water share');
    if (dom === 7) expense(d, 19, exp('Load'), [gcash], 100, 'Mobile load');

    const meals = rand() < 0.35 ? 2 : 1;
    for (let i = 0; i < meals; i++) expense(d, 11 + i * 7, exp('Food'), rand() < 0.6 ? [cash, gcash] : [gcash, cash], between(60, 210), pickOne(foods));
    if (dow !== 0 && dow !== 6 && rand() < 0.75) expense(d, 7, exp('Fare / Commute'), [cash, gcash], between(2, 6) * 10, 'Jeep and tricycle');
    if (rand() < 0.06) expense(d, 16, exp('Shopping'), [gcash, bpi, cash], between(3, 9) * 100, 'Clothes and school supplies');
    if (rand() < 0.08) expense(d, 20, exp('Entertainment'), [gcash, cash], between(2, 5) * 100, 'Movie with friends');
    if (rand() < 0.03) expense(d, 15, exp('Health'), [cash, gcash], between(1, 3) * 100, 'Medicine');
  }

  await Transaction.insertMany(txs);

  // Budgets: one per month, a little different each time.
  const limits = [12000, 12000, 12500, 13000, 12500, 13500];
  await Budget.insertMany(
    limits.map((monthlyLimit, i) => ({ month: shiftMonth(startKey, i), monthlyLimit })).filter((b) => b.month <= monthKey(now))
  );

  // Savings goals with matching deposit history.
  const total = [...balance.values()].reduce((s, v) => s + v, 0);
  const planned = [
    { title: 'Emergency Fund', targetAmount: 15000, saved: 3500, color: '#f59e0b', targetDate: new Date(now.getTime() + 150 * DAY) },
    { title: 'New Laptop', targetAmount: 45000, saved: 9000, color: '#2563eb', targetDate: new Date(now.getTime() + 240 * DAY) },
    { title: 'Baguio Trip', targetAmount: 6000, saved: 6000, color: '#10b981', targetDate: null },
  ];
  const plannedTotal = planned.reduce((s, g) => s + g.saved, 0);
  if (plannedTotal > total) throw new Error(`Seed would save ${plannedTotal} but only ${total.toFixed(2)} is available`);

  for (const g of planned) {
    const goal = await SavingsGoal.create({ title: g.title, targetAmount: g.targetAmount, savedAmount: g.saved, color: g.color, targetDate: g.targetDate });
    const firstPart = Math.round(g.saved * 0.6);
    await SavingsEntry.insertMany([
      { goal: goal._id, type: 'Deposit', amount: firstPart, note: 'Initial deposit', date: new Date(now.getTime() - 60 * DAY) },
      { goal: goal._id, type: 'Deposit', amount: g.saved - firstPart, note: 'Monthly top-up', date: new Date(now.getTime() - 18 * DAY) },
    ]);
  }

  return { transactions: txs.length, totalBalance: Math.round(total * 100) / 100, saved: plannedTotal };
}

module.exports = { seedDatabase };

if (require.main === module) {
  connectDB()
    .then(seedDatabase)
    .then((r) => {
      console.log('Seeded:', r);
      return mongoose.disconnect();
    })
    .catch((err) => {
      console.error('Seed failed:', err.message);
      process.exit(1);
    });
}
