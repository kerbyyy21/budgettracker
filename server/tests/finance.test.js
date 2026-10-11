const test = require('node:test');
const assert = require('node:assert');
process.env.TZ_OFFSET_MINUTES = '480';
const f = require('../services/finance');

test('monthKey respects the Manila timezone at month boundaries', () => {
  // 2026-09-30 17:00 UTC is already 2026-10-01 01:00 in Manila
  assert.strictEqual(f.monthKey(new Date('2026-09-30T17:00:00Z')), '2026-10');
  assert.strictEqual(f.monthKey(new Date('2026-09-30T15:59:00Z')), '2026-09');
});

test('monthRange is [start, end) in real UTC instants', () => {
  const { start, end } = f.monthRange('2026-10');
  assert.strictEqual(start.toISOString(), '2026-09-30T16:00:00.000Z');
  assert.strictEqual(end.toISOString(), '2026-10-31T16:00:00.000Z');
});

test('shiftMonth and lastMonths cross year boundaries', () => {
  assert.strictEqual(f.shiftMonth('2026-01', -1), '2025-12');
  assert.deepStrictEqual(f.lastMonths(3, '2026-01'), ['2025-11', '2025-12', '2026-01']);
});

test('daysInMonth handles leap years', () => {
  assert.strictEqual(f.daysInMonth('2028-02'), 29);
  assert.strictEqual(f.daysInMonth('2026-02'), 28);
});

test('budgetStatus: safe / near / over thresholds', () => {
  const now = new Date('2026-10-10T04:00:00Z');
  assert.strictEqual(f.budgetStatus({ limit: 1000, spent: 799, key: '2026-10', now }).status, 'safe');
  assert.strictEqual(f.budgetStatus({ limit: 1000, spent: 800, key: '2026-10', now }).status, 'near');
  assert.strictEqual(f.budgetStatus({ limit: 1000, spent: 1000, key: '2026-10', now }).status, 'over');
  assert.strictEqual(f.budgetStatus({ limit: 0, spent: 50, key: '2026-10', now }).status, 'no-budget');
});

test('budgetStatus: daily allowance and projection', () => {
  const now = new Date('2026-10-10T04:00:00Z'); // day 10 of 31 in Manila
  const s = f.budgetStatus({ limit: 3100, spent: 1000, key: '2026-10', now });
  assert.strictEqual(s.daysLeft, 22);
  assert.strictEqual(s.safeDailySpend, Math.round((2100 / 22) * 100) / 100);
  assert.strictEqual(s.projectedSpend, 3100);
  assert.strictEqual(s.willExceed, false);
});

test('budgetStatus: past months have no days left, future months are untouched', () => {
  const now = new Date('2026-10-10T04:00:00Z');
  assert.strictEqual(f.budgetStatus({ limit: 1000, spent: 500, key: '2026-09', now }).daysLeft, 0);
  assert.strictEqual(f.budgetStatus({ limit: 1000, spent: 0, key: '2026-11', now }).daysLeft, 30);
});

test('summarize computes totals, savings rate and extremes', () => {
  const now = new Date('2026-10-10T04:00:00Z');
  const txs = [
    { type: 'Income', amount: 1000 },
    { type: 'Expense', amount: 200 },
    { type: 'Expense', amount: 50 },
  ];
  const s = f.summarize(txs, '2026-10', now);
  assert.strictEqual(s.net, 750);
  assert.strictEqual(s.savingsRate, 75);
  assert.strictEqual(s.averageExpense, 125);
  assert.strictEqual(s.averageDailySpend, 25);
  assert.strictEqual(s.largestExpense.amount, 200);
  assert.strictEqual(s.smallestExpense.amount, 50);
});

test('summarize with no income does not divide by zero', () => {
  assert.strictEqual(f.summarize([{ type: 'Expense', amount: 10 }], '2026-10').savingsRate, 0);
  assert.strictEqual(f.summarize([], '2026-10').averageExpense, 0);
});

test('categoryBreakdown ranks and gives percentages', () => {
  const rows = f.categoryBreakdown([
    { amount: 300, category: { _id: 'a', name: 'Food' } },
    { amount: 100, category: { _id: 'b', name: 'Fare' } },
    { amount: 100, category: { _id: 'a', name: 'Food' } },
  ]);
  assert.strictEqual(rows[0].category.name, 'Food');
  assert.strictEqual(rows[0].total, 400);
  assert.strictEqual(rows[0].percentage, 80);
  assert.strictEqual(rows[1].rank, 2);
});

test('goalProgress: completed, overdue and required monthly saving', () => {
  const now = new Date('2026-10-10T00:00:00Z');
  assert.strictEqual(f.goalProgress({ targetAmount: 100, savedAmount: 100 }, now).status, 'completed');
  assert.strictEqual(f.goalProgress({ targetAmount: 100, savedAmount: 10, targetDate: new Date('2026-09-01') }, now).status, 'overdue');
  const g = f.goalProgress({ targetAmount: 1000, savedAmount: 400, targetDate: new Date('2026-12-09T00:00:00Z') }, now);
  assert.strictEqual(g.percent, 40);
  assert.strictEqual(g.remaining, 600);
  assert.strictEqual(g.requiredPerMonth, 300); // 60 days => 2 months
});

test('plan rules: wallet limits, yearly savings and renewal dates', () => {
  assert.strictEqual(f.walletAllowed('Basic', 1), false);
  assert.strictEqual(f.walletAllowed('Plus', 2), true);
  assert.strictEqual(f.walletAllowed('Premium', 50), true);
  assert.deepStrictEqual(f.yearlySavings('Plus'), { amount: 189, percent: 16 });
  assert.strictEqual(f.addMonths(new Date('2026-01-31T00:00:00Z'), 1).toISOString().slice(0, 10), '2026-02-28');
});
