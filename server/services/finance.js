// Pure calculation helpers (no database access) so the business rules are easy to test and explain.

const TZ_OFFSET_MIN = () => Number(process.env.TZ_OFFSET_MINUTES ?? 480);
const MIN_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const round1 = (n) => Math.round((Number(n) + Number.EPSILON) * 10) / 10;

// A Date shifted into the app's timezone; read it with the getUTC* methods.
const local = (date) => new Date(new Date(date).getTime() + TZ_OFFSET_MIN() * MIN_MS);

const isValidMonthKey = (key) => /^\d{4}-(0[1-9]|1[0-2])$/.test(String(key));

function monthKey(date) {
  const d = local(date);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

// [start, end) of a month in real UTC instants, respecting the app timezone.
function monthRange(key) {
  const [y, m] = key.split('-').map(Number);
  return {
    start: new Date(Date.UTC(y, m - 1, 1) - TZ_OFFSET_MIN() * MIN_MS),
    end: new Date(Date.UTC(y, m, 1) - TZ_OFFSET_MIN() * MIN_MS),
  };
}

function daysInMonth(key) {
  const [y, m] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

function shiftMonth(key, delta) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

const lastMonths = (count, fromKey) =>
  Array.from({ length: count }, (_, i) => shiftMonth(fromKey, i - (count - 1)));

// ---- Balances -------------------------------------------------------------

const signed = (tx) => (tx.type === 'Income' ? tx.amount : -tx.amount);

function walletBalance(initialBalance, income, expenses) {
  return round2(initialBalance + income - expenses);
}

// ---- Summary --------------------------------------------------------------

function summarize(transactions, key, now = new Date()) {
  let income = 0;
  let expenses = 0;
  let expenseCount = 0;
  let largest = null;
  let smallest = null;

  for (const tx of transactions) {
    if (tx.type === 'Income') {
      income += tx.amount;
    } else {
      expenses += tx.amount;
      expenseCount += 1;
      if (!largest || tx.amount > largest.amount) largest = tx;
      if (!smallest || tx.amount < smallest.amount) smallest = tx;
    }
  }

  const days = daysInMonth(key);
  const current = monthKey(now);
  const elapsed = key === current ? local(now).getUTCDate() : key < current ? days : 0;

  return {
    month: key,
    income: round2(income),
    expenses: round2(expenses),
    net: round2(income - expenses),
    savingsRate: income > 0 ? round1(((income - expenses) / income) * 100) : 0,
    transactionCount: transactions.length,
    expenseCount,
    averageExpense: expenseCount ? round2(expenses / expenseCount) : 0,
    averageDailySpend: elapsed > 0 ? round2(expenses / elapsed) : 0,
    largestExpense: largest,
    smallestExpense: smallest,
  };
}

// ---- Category breakdown ---------------------------------------------------

function categoryBreakdown(transactions) {
  const groups = new Map();
  let grand = 0;
  for (const tx of transactions) {
    const id = String(tx.category?._id ?? tx.category);
    if (!groups.has(id)) groups.set(id, { category: tx.category, total: 0, count: 0 });
    const g = groups.get(id);
    g.total += tx.amount;
    g.count += 1;
    grand += tx.amount;
  }
  return [...groups.values()]
    .sort((a, b) => b.total - a.total)
    .map((g, i) => ({
      rank: i + 1,
      category: g.category,
      total: round2(g.total),
      count: g.count,
      average: round2(g.total / g.count),
      percentage: grand > 0 ? round1((g.total / grand) * 100) : 0,
    }));
}

// ---- Monthly trend --------------------------------------------------------

function monthlyTrend(transactions, keys) {
  const buckets = new Map(keys.map((k) => [k, { income: 0, expenses: 0 }]));
  for (const tx of transactions) {
    const b = buckets.get(monthKey(tx.date));
    if (!b) continue;
    if (tx.type === 'Income') b.income += tx.amount;
    else b.expenses += tx.amount;
  }
  let previous = null;
  return keys.map((k) => {
    const { income, expenses } = buckets.get(k);
    const row = {
      month: k,
      income: round2(income),
      expenses: round2(expenses),
      net: round2(income - expenses),
      expenseChange: previous && previous.expenses > 0 ? round1(((expenses - previous.expenses) / previous.expenses) * 100) : null,
    };
    previous = row;
    return row;
  });
}

// ---- Budget ---------------------------------------------------------------

function budgetStatus({ limit, spent, key, now = new Date() }) {
  const days = daysInMonth(key);
  const current = monthKey(now);
  const isCurrent = key === current;
  const isPast = key < current;
  const elapsed = isCurrent ? local(now).getUTCDate() : isPast ? days : 0;
  const daysLeft = isCurrent ? days - elapsed + 1 : isPast ? 0 : days;

  spent = round2(spent);
  if (!limit || limit <= 0) {
    return { month: key, limit: 0, spent, remaining: 0, percentUsed: 0, status: 'no-budget', daysLeft, safeDailySpend: 0, projectedSpend: spent, willExceed: false };
  }

  const percentUsed = round1((spent / limit) * 100);
  const status = spent >= limit ? 'over' : spent >= limit * 0.8 ? 'near' : 'safe';
  const remaining = round2(limit - spent);
  const projectedSpend = isCurrent && elapsed > 0 ? round2((spent / elapsed) * days) : spent;

  return {
    month: key,
    limit: round2(limit),
    spent,
    remaining,
    percentUsed,
    status,
    daysLeft,
    safeDailySpend: remaining > 0 && daysLeft > 0 ? round2(remaining / daysLeft) : 0,
    projectedSpend,
    willExceed: projectedSpend > limit,
  };
}

// ---- Savings goals --------------------------------------------------------

function goalProgress(goal, now = new Date()) {
  const target = goal.targetAmount;
  const saved = goal.savedAmount;
  const remaining = round2(Math.max(0, target - saved));
  const completed = saved >= target;
  const percent = Math.min(100, round1((saved / target) * 100));

  let daysLeft = null;
  let requiredPerMonth = null;
  let overdue = false;

  if (goal.targetDate && !completed) {
    const diff = new Date(goal.targetDate).getTime() - now.getTime();
    overdue = diff < 0;
    daysLeft = overdue ? 0 : Math.ceil(diff / DAY_MS);
    if (!overdue) requiredPerMonth = round2(remaining / Math.max(1, Math.ceil(daysLeft / 30.4375)));
  }

  return {
    percent,
    remaining,
    daysLeft,
    requiredPerMonth,
    status: completed ? 'completed' : overdue ? 'overdue' : 'active',
  };
}

// ---- Subscription plans ---------------------------------------------------

const PLAN_CATALOG = {
  Basic: { name: 'Basic', walletLimit: 1, monthly: 0, yearly: 0, features: ['1 wallet', 'Transactions and budget', 'Savings goals'] },
  Plus: { name: 'Plus', walletLimit: 3, monthly: 99, yearly: 999, features: ['Up to 3 wallets', 'Full reports', 'Savings goals'] },
  Premium: { name: 'Premium', walletLimit: null, monthly: 179, yearly: 1799, features: ['Unlimited wallets', 'Full reports', 'Priority insights'] },
};

const walletAllowed = (plan, count) => PLAN_CATALOG[plan].walletLimit === null || count < PLAN_CATALOG[plan].walletLimit;

function planPrice(plan, cycle) {
  const p = PLAN_CATALOG[plan];
  return cycle === 'yearly' ? p.yearly : p.monthly;
}

function yearlySavings(plan) {
  const p = PLAN_CATALOG[plan];
  const full = p.monthly * 12;
  return { amount: full - p.yearly, percent: full > 0 ? Math.round(((full - p.yearly) / full) * 100) : 0 };
}

function addMonths(date, months) {
  const d = new Date(date);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d;
}

function subscriptionInfo(profile, now = new Date()) {
  const trialActive = !!profile.trialEndsAt && new Date(profile.trialEndsAt) > now;
  const trialDaysLeft = trialActive ? Math.ceil((new Date(profile.trialEndsAt) - now) / DAY_MS) : 0;
  let renewsOn = null;
  if (profile.plan !== 'Basic') {
    renewsOn = trialActive
      ? profile.trialEndsAt
      : addMonths(profile.planStartedAt, profile.billingCycle === 'yearly' ? 12 : 1);
  }
  return {
    walletLimit: PLAN_CATALOG[profile.plan].walletLimit,
    price: planPrice(profile.plan, profile.billingCycle),
    trialActive,
    trialDaysLeft,
    renewsOn,
  };
}

module.exports = {
  round2, round1, signed, isValidMonthKey, monthKey, monthRange, daysInMonth, shiftMonth, lastMonths,
  walletBalance, summarize, categoryBreakdown, monthlyTrend, budgetStatus, goalProgress,
  PLAN_CATALOG, walletAllowed, planPrice, yearlySavings, addMonths, subscriptionInfo,
};
