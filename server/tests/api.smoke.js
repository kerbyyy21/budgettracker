// End-to-end smoke test against a RUNNING server with seeded data.
//   npm run seed && npm start      (in another terminal)
//   node tests/api.smoke.js
const BASE = process.env.API_URL || 'http://localhost:5000/api';
let pass = 0;
let fail = 0;

async function call(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
  let json = null;
  try { json = await res.json(); } catch { /* empty */ }
  return { status: res.status, body: json };
}

function check(name, cond, extra = '') {
  if (cond) { pass += 1; console.log(`  PASS  ${name}`); } else { fail += 1; console.log(`  FAIL  ${name} ${extra}`); }
}
const expectStatus = (name, r, status) => check(name, r.status === status, `(got ${r.status}: ${JSON.stringify(r.body)?.slice(0, 160)})`);

(async () => {
  const wallets = (await call('GET', '/wallets')).body;
  const cash = wallets.data.find((w) => w.isDefault);
  const gcash = wallets.data.find((w) => w.name === 'GCash');
  const cats = (await call('GET', '/categories')).body.data;
  const food = cats.find((c) => c.name === 'Food' && c.type === 'Expense');
  const allowance = cats.find((c) => c.name === 'Allowance');

  console.log('Errors and middleware');
  expectStatus('unknown route -> 404 JSON', await call('GET', '/nope'), 404);
  expectStatus('invalid id -> 400', await call('GET', '/transactions/not-an-id'), 400);
  expectStatus('unknown id -> 404', await call('GET', '/transactions/64b7f0f0f0f0f0f0f0f0f0f0'), 404);
  expectStatus('malformed JSON -> 400', await call('POST', '/transactions', '{bad json'), 400);
  const empty = await call('POST', '/transactions', {});
  expectStatus('empty body -> 400', empty, 400);
  check('per-field errors returned', empty.body?.errors?.amount && empty.body?.errors?.category && empty.body?.errors?.wallet);
  expectStatus('negative amount -> 400', await call('POST', '/transactions', { type: 'Expense', amount: -5, category: food._id, wallet: cash._id }), 400);
  expectStatus('future date -> 400', await call('POST', '/transactions', { type: 'Expense', amount: 5, category: food._id, wallet: cash._id, date: '2099-01-01' }), 400);
  expectStatus('category type mismatch -> 400', await call('POST', '/transactions', { type: 'Income', amount: 5, category: food._id, wallet: cash._id }), 400);

  console.log('Transactions CRUD and balance rules');
  const before = (await call('GET', `/wallets/${cash._id}`)).body.balance;
  const created = await call('POST', '/transactions', { type: 'Expense', amount: 100.5, category: food._id, wallet: cash._id, paymentMethod: 'Cash', note: 'Smoke test lunch' });
  expectStatus('create expense -> 201', created, 201);
  const id = created.body?._id;
  check('wallet balance dropped by 100.50', (await call('GET', `/wallets/${cash._id}`)).body.balance === Math.round((before - 100.5) * 100) / 100);
  expectStatus('overdraft -> 400', await call('POST', '/transactions', { type: 'Expense', amount: 9999999, category: food._id, wallet: cash._id }), 400);
  expectStatus('update -> 200', await call('PUT', `/transactions/${id}`, { amount: 50 }), 200);
  check('balance reflects update', (await call('GET', `/wallets/${cash._id}`)).body.balance === Math.round((before - 50) * 100) / 100);
  const found = await call('GET', '/transactions?q=smoke%20test');
  check('search by note finds it', found.body?.data?.some((t) => t._id === id));
  expectStatus('delete -> 200', await call('DELETE', `/transactions/${id}`), 200);
  expectStatus('deleted -> 404', await call('GET', `/transactions/${id}`), 404);
  check('balance restored', (await call('GET', `/wallets/${cash._id}`)).body.balance === before);

  console.log('Filtering, sorting and pagination');
  const month = (await call('GET', '/dashboard')).body.month;
  const list = await call('GET', `/transactions?month=${month}&type=Expense&sort=amount&order=desc&limit=5`);
  check('filtered list ok', list.status === 200 && list.body.data.length <= 5);
  check('sorted by amount desc', list.body.data.every((t, i, a) => i === 0 || a[i - 1].amount >= t.amount));
  check('only expenses', list.body.data.every((t) => t.type === 'Expense'));
  check('totals consistent', list.body.totals.income === 0 && list.body.totals.expenses > 0);
  expectStatus('bad month -> 400', await call('GET', '/transactions?month=2026-13'), 400);
  expectStatus('bad sort -> 400', await call('GET', '/transactions?sort=banana'), 400);
  const p2 = await call('GET', '/transactions?limit=10&page=2');
  check('page 2 differs from page 1', p2.body.data[0]._id !== (await call('GET', '/transactions?limit=10&page=1')).body.data[0]._id);

  console.log('Categories');
  expectStatus('duplicate category -> 409', await call('POST', '/categories', { name: 'food', type: 'Expense' }), 409);
  const cat = await call('POST', '/categories', { name: 'Pets', type: 'Expense', icon: 'paw-print', color: '#8b5cf6' });
  expectStatus('create category -> 201', cat, 201);
  expectStatus('bad icon -> 400', await call('POST', '/categories', { name: 'Zzz', type: 'Expense', icon: 'nope' }), 400);
  expectStatus('edit default -> 403', await call('PUT', `/categories/${food._id}`, { name: 'Meals' }), 403);
  expectStatus('delete custom -> 200', await call('DELETE', `/categories/${cat.body._id}`), 200);
  expectStatus('delete default -> 403', await call('DELETE', `/categories/${food._id}`), 403);

  console.log('Wallets and subscription plans');
  expectStatus('wallet limit on Plus -> 403', await call('POST', '/wallets', { name: 'Maya', type: 'Digital Wallet' }), 403);
  expectStatus('delete default wallet -> 403', await call('DELETE', `/wallets/${cash._id}`), 403);
  expectStatus('delete wallet with transactions -> 409', await call('DELETE', `/wallets/${gcash._id}`), 409);
  expectStatus('same plan -> 400', await call('POST', '/profile/subscribe', { plan: 'Plus', billingCycle: 'monthly' }), 400);
  expectStatus('bad plan -> 400', await call('POST', '/profile/subscribe', { plan: 'Gold' }), 400);
  expectStatus('downgrade to Basic with 3 wallets -> 400', await call('POST', '/profile/subscribe', { plan: 'Basic' }), 400);
  expectStatus('upgrade to Premium -> 200', await call('POST', '/profile/subscribe', { plan: 'Premium', billingCycle: 'yearly' }), 200);
  const maya = await call('POST', '/wallets', { name: 'Maya', type: 'Digital Wallet', initialBalance: 250 });
  expectStatus('add wallet on Premium -> 201', maya, 201);
  expectStatus('delete empty wallet -> 200', await call('DELETE', `/wallets/${maya.body._id}`), 200);
  expectStatus('back to Plus -> 200', await call('POST', '/profile/subscribe', { plan: 'Plus', billingCycle: 'monthly' }), 200);

  console.log('Budgets');
  expectStatus('bad month -> 400', await call('PUT', '/budgets/2026-99', { monthlyLimit: 100 }), 400);
  expectStatus('bad limit -> 400', await call('PUT', '/budgets/2030-01', { monthlyLimit: 0 }), 400);
  expectStatus('create budget -> 201', await call('PUT', '/budgets/2030-01', { monthlyLimit: 5000 }), 201);
  expectStatus('replace budget -> 200', await call('PUT', '/budgets/2030-01', { monthlyLimit: 6000 }), 200);
  const future = await call('GET', '/budgets/status?month=2030-01');
  check('future month: nothing spent, full days left', future.body.spent === 0 && future.body.daysLeft === 31 && future.body.status === 'safe');
  expectStatus('delete budget -> 200', await call('DELETE', '/budgets/2030-01'), 200);
  expectStatus('delete again -> 404', await call('DELETE', '/budgets/2030-01'), 404);
  check('month without budget carries the latest earlier one forward', (await call('GET', '/budgets/status?month=2031-01')).body.carriedFrom !== null);

  console.log('Savings goals');
  const goals = (await call('GET', '/savings-goals')).body;
  const laptop = goals.data.find((g) => g.title === 'New Laptop');
  const done = goals.data.find((g) => g.progress.status === 'completed');
  expectStatus('deposit zero -> 400', await call('POST', `/savings-goals/${laptop._id}/deposit`, { amount: 0 }), 400);
  expectStatus('deposit text -> 400', await call('POST', `/savings-goals/${laptop._id}/deposit`, { amount: 'abc' }), 400);
  expectStatus('deposit more than available -> 400', await call('POST', `/savings-goals/${laptop._id}/deposit`, { amount: goals.totals.availableToSave + 1 }), 400);
  expectStatus('deposit into completed goal -> 400', await call('POST', `/savings-goals/${done._id}/deposit`, { amount: 10 }), 400);
  const dep = await call('POST', `/savings-goals/${laptop._id}/deposit`, { amount: 1000, note: 'smoke' });
  expectStatus('deposit -> 201', dep, 201);
  check('saved amount increased', dep.body?.goal?.savedAmount === laptop.savedAmount + 1000);
  check('available to save decreased', dep.body?.availableToSave === goals.totals.availableToSave - 1000);
  expectStatus('withdraw too much -> 400', await call('POST', `/savings-goals/${laptop._id}/withdraw`, { amount: 99999999 }), 400);
  expectStatus('withdraw -> 201', await call('POST', `/savings-goals/${laptop._id}/withdraw`, { amount: 1000 }), 201);
  const detail = await call('GET', `/savings-goals/${laptop._id}`);
  check('detail has history', detail.body.entries.length >= 4);
  expectStatus('target below saved -> 400', await call('PUT', `/savings-goals/${laptop._id}`, { targetAmount: 100 }), 400);
  expectStatus('duplicate title -> 409', await call('POST', '/savings-goals', { title: 'New Laptop', targetAmount: 100 }), 409);
  const g = await call('POST', '/savings-goals', { title: 'Smoke goal', targetAmount: 1000, targetDate: new Date(Date.now() + 90 * 864e5).toISOString() });
  expectStatus('create goal -> 201', g, 201);
  check('required per month computed', g.body.progress.requiredPerMonth > 0);
  expectStatus('past target date -> 400', await call('POST', '/savings-goals', { title: 'Old', targetAmount: 100, targetDate: '2020-01-01' }), 400);
  expectStatus('delete goal -> 200', await call('DELETE', `/savings-goals/${g.body._id}`), 200);

  console.log('Reports and profile');
  const summary = await call('GET', '/reports/summary');
  check('summary ok', summary.status === 200 && summary.body.net === Math.round((summary.body.income - summary.body.expenses) * 100) / 100);
  const bd = await call('GET', '/reports/category-breakdown');
  check('breakdown percentages ~100', Math.abs(bd.body.data.reduce((s, r) => s + r.percentage, 0) - 100) < 1);
  expectStatus('trend bad months -> 400', await call('GET', '/reports/monthly-trend?months=99'), 400);
  expectStatus('trend ok', await call('GET', '/reports/monthly-trend?months=3'), 200);
  expectStatus('insights ok', await call('GET', '/reports/insights'), 200);
  expectStatus('profile bad email -> 400', await call('PUT', '/profile', { email: 'nope' }), 400);
  expectStatus('plans ok', await call('GET', '/profile/plans'), 200);
  expectStatus('health ok', await call('GET', '/health'), 200);
  void allowance;

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
