import { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { reportApi, walletApi } from '../api/endpoints';
import { useFetch } from '../hooks/useFetch';
import { currentMonth, formatDate, formatMonth, formatPeso, formatPesoWhole, shortMonth } from '../lib/format';
import type { Insight, TxType } from '../types';
import { CategoryIcon, PageHeader, ProgressBar, Segmented } from '../components/ui/Misc';
import { EmptyState, ErrorState, PageLoader } from '../components/ui/StateViews';
import { MonthSwitcher } from '../components/MonthSwitcher';

const levelStyle: Record<Insight['level'], string> = { info: 'bg-sky-50 text-sky-600', warning: 'bg-sun-50 text-sun-600', success: 'bg-leaf-50 text-leaf-700' };

export default function Reports() {
  const [month, setMonth] = useState(currentMonth());
  const [type, setType] = useState<TxType>('Expense');
  const [wallet, setWallet] = useState('');

  const wallets = useFetch(() => walletApi.list(), []);
  const summary = useFetch(() => reportApi.summary(month, wallet), [month, wallet]);
  const breakdown = useFetch(() => reportApi.breakdown(month, type, wallet), [month, type, wallet]);
  const trend = useFetch(() => reportApi.trend(6, wallet), [wallet]);
  const insights = useFetch(() => reportApi.insights(month), [month]);

  const reloadAll = () => { summary.reload(); breakdown.reload(); trend.reload(); insights.reload(); };
  const s = summary.data;
  const bd = breakdown.data;
  const trendRows = (trend.data ?? []).map((r) => ({ ...r, label: shortMonth(r.month) }));

  return (
    <div>
      <PageHeader title="Reports" subtitle="See where your money went and how it is trending."
        actions={<>
          <select aria-label="Filter by wallet" className="input !min-h-[44px] !w-auto !py-2" value={wallet} onChange={(e) => setWallet(e.target.value)}>
            <option value="">All wallets</option>
            {wallets.data?.data.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
          </select>
          <MonthSwitcher month={month} onChange={setMonth} />
        </>} />

      {summary.loading && !s ? <PageLoader label="Building your report…" /> : summary.error || !s ? <ErrorState message={summary.error ?? 'No data'} onRetry={reloadAll} /> : (
        <div className="space-y-6">
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="card p-4"><p className="text-sm font-semibold text-ink-muted">Income</p><p className="truncate font-display text-xl font-bold text-leaf-600 sm:text-2xl">{formatPeso(s.income)}</p></div>
            <div className="card p-4"><p className="text-sm font-semibold text-ink-muted">Expenses</p><p className="truncate font-display text-xl font-bold text-coral-600 sm:text-2xl">{formatPeso(s.expenses)}</p></div>
            <div className="card p-4"><p className="text-sm font-semibold text-ink-muted">Net</p><p className={`truncate font-display text-xl font-bold sm:text-2xl ${s.net < 0 ? 'text-coral-600' : ''}`}>{formatPeso(s.net)}</p></div>
            <div className="card p-4"><p className="text-sm font-semibold text-ink-muted">Savings rate</p><p className="font-display text-xl font-bold sm:text-2xl">{s.savingsRate}%</p></div>
          </section>

          {s.transactionCount === 0 ? (
            <div className="card"><EmptyState icon={BarChart3} title={`No activity in ${formatMonth(month)}`} message="Pick another month, or add transactions to generate this report." /></div>
          ) : (
            <>
              <section className="grid gap-3 sm:grid-cols-3">
                <div className="card p-4"><p className="text-sm font-semibold text-ink-muted">Average expense</p><p className="font-display text-lg font-bold">{formatPeso(s.averageExpense)}</p><p className="text-xs text-ink-muted">{s.expenseCount} expenses</p></div>
                <div className="card p-4"><p className="text-sm font-semibold text-ink-muted">Average per day</p><p className="font-display text-lg font-bold">{formatPeso(s.averageDailySpend)}</p></div>
                <div className="card p-4"><p className="text-sm font-semibold text-ink-muted">Biggest expense</p>{s.largestExpense ? <><p className="font-display text-lg font-bold">{formatPeso(s.largestExpense.amount)}</p><p className="truncate text-xs text-ink-muted">{s.largestExpense.note || s.largestExpense.category.name} · {formatDate(s.largestExpense.date)}</p></> : <p className="text-ink-muted">None</p>}</div>
              </section>

              <section className="card p-5">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-xl font-bold">By category</h2>
                  <div className="w-full sm:w-64"><Segmented name="Breakdown type" value={type} onChange={setType} options={[{ value: 'Expense', label: 'Expenses' }, { value: 'Income', label: 'Income' }]} /></div>
                </div>
                {breakdown.loading && !bd ? <PageLoader /> : breakdown.error ? <ErrorState message={breakdown.error} onRetry={breakdown.reload} /> : !bd || bd.data.length === 0 ? (
                  <EmptyState icon={BarChart3} title={`No ${type.toLowerCase()} this month`} message="Nothing to break down for this selection." />
                ) : (
                  <div className="grid items-center gap-6 md:grid-cols-[260px_1fr]">
                    <div className="relative mx-auto h-60 w-60" role="img" aria-label={`${type} by category`}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={bd.data} dataKey="total" nameKey="category.name" innerRadius={72} outerRadius={110} paddingAngle={2} stroke="none">
                            {bd.data.map((r) => <Cell key={r.category._id} fill={r.category.color} />)}
                          </Pie>
                          <Tooltip formatter={(v: number) => formatPeso(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-xs font-semibold text-ink-muted">Total</span><span className="font-display text-xl font-bold">{formatPesoWhole(bd.total)}</span></div>
                    </div>
                    <ul className="space-y-3">
                      {bd.data.map((r) => (
                        <li key={r.category._id} className="flex items-center gap-3">
                          <CategoryIcon icon={r.category.icon} color={r.category.color} size="sm" />
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-baseline justify-between gap-2"><span className="truncate font-bold">{r.category.name}</span><span className="shrink-0 text-sm font-bold">{formatPeso(r.total)} <span className="text-ink-muted">· {r.percentage}%</span></span></div>
                            <ProgressBar value={r.percentage} color={r.category.color} label={`${r.category.name} share`} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            </>
          )}

          <section className="card p-5">
            <h2 className="mb-4 text-xl font-bold">Last 6 months</h2>
            {trend.loading && !trend.data ? <PageLoader /> : trend.error ? <ErrorState message={trend.error} onRetry={trend.reload} /> : (
              <>
                <div className="h-64 w-full" role="img" aria-label="Income and expenses by month">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendRows} margin={{ left: -10, right: 4 }}>
                      <CartesianGrid vertical={false} stroke="#e4e0d2" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v / 1000}k`} />
                      <Tooltip formatter={(v: number) => formatPeso(v)} cursor={{ fill: '#f6f4ec' }} />
                      <Bar dataKey="income" name="Income" fill="#1fa87a" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="expenses" name="Expenses" fill="#e8553d" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 flex gap-4 text-sm font-semibold text-ink-soft"><span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-leaf-500" /> Income</span><span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-coral-500" /> Expenses</span></div>
              </>
            )}
          </section>

          {insights.data && insights.data.length > 0 && (
            <section>
              <h2 className="mb-3 text-xl font-bold">Insights</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {insights.data.map((i) => (
                  <div key={i.title} className="card flex gap-3 p-4"><span className={`mt-0.5 h-3 w-3 shrink-0 rounded-full ${levelStyle[i.level].split(' ')[0]} ring-4 ring-current ${levelStyle[i.level].split(' ')[1]}`} /><div><h3 className="font-bold">{i.title}</h3><p className="text-sm text-ink-soft">{i.message}</p></div></div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
