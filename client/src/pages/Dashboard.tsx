import { Link } from 'react-router-dom';
import { ArrowRight, Lightbulb, Plus, TrendingDown, TrendingUp, TriangleAlert, CheckCircle2, PiggyBank, Wallet as WalletIcon } from 'lucide-react';
import { dashboardApi } from '../api/endpoints';
import { useFetch } from '../hooks/useFetch';
import { formatMonth, formatPeso, formatPesoWhole } from '../lib/format';
import { ErrorState, PageLoader, EmptyState } from '../components/ui/StateViews';
import { Badge, CategoryIcon, ProgressBar } from '../components/ui/Misc';
import { Ring, budgetColor } from '../components/BudgetRing';
import { TransactionRow } from '../components/TransactionRow';
import type { Insight } from '../types';

const insightStyle: Record<Insight['level'], { box: string; Icon: typeof Lightbulb }> = {
  info: { box: 'bg-sky-50 text-sky-600', Icon: Lightbulb },
  warning: { box: 'bg-sun-50 text-sun-600', Icon: TriangleAlert },
  success: { box: 'bg-leaf-50 text-leaf-700', Icon: CheckCircle2 },
};

function greeting() {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Asia/Manila' }).format(new Date()));
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
}

export default function Dashboard() {
  const { data, loading, error, reload } = useFetch(() => dashboardApi.get(), []);

  if (loading) return <PageLoader label="Loading your dashboard…" />;
  if (error || !data) return <ErrorState message={error ?? 'No data'} onRetry={reload} />;

  const { money, summary, budget, wallets, recentTransactions, goals, insights, topCategory } = data;
  // Derived in render: nothing here is stored in state.
  const budgetTone = budget.status === 'over' ? 'coral' : budget.status === 'near' ? 'sun' : 'green';
  const budgetLabel = { safe: 'On track', near: 'Close to limit', over: 'Over budget', 'no-budget': 'No budget set' }[budget.status];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-semibold text-ink-muted">{formatMonth(data.month)}</p>
          <h1 className="text-3xl font-extrabold sm:text-4xl">{greeting()}, {data.user.name.split(' ')[0]}</h1>
        </div>
        <Link to="/app/transactions/new" className="btn btn-primary hidden sm:inline-flex"><Plus className="h-5 w-5" /> Add transaction</Link>
      </div>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.25fr_1fr]">
        <div className="rise relative overflow-hidden rounded-3xl bg-ink p-6 text-white shadow-pop sm:p-8">
          <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-leaf-500/25" aria-hidden />
          <div className="absolute -bottom-16 right-10 h-40 w-40 rounded-full bg-sun-500/15" aria-hidden />
          <p className="relative text-sm font-semibold text-leaf-300">Available to spend</p>
          <p className="relative mt-1 font-display text-4xl font-extrabold sm:text-5xl">{formatPeso(money.available)}</p>
          <dl className="relative mt-6 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-white/10 p-3.5"><dt className="text-white/60">Total across wallets</dt><dd className="mt-0.5 font-display text-lg font-bold">{formatPeso(money.totalBalance)}</dd></div>
            <div className="rounded-2xl bg-white/10 p-3.5"><dt className="text-white/60">Set aside in goals</dt><dd className="mt-0.5 font-display text-lg font-bold text-sun-100">{formatPeso(money.totalSaved)}</dd></div>
          </dl>
        </div>

        <div className="card rise flex items-center gap-5 p-5 sm:p-6">
          <Ring percent={budget.percentUsed} color={budgetColor(budget.status)} label="Budget used" sub="used" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold">Monthly budget</h2><Badge tone={budgetTone}>{budgetLabel}</Badge></div>
            {budget.status === 'no-budget' ? (
              <p className="mt-2 text-sm text-ink-soft">Set a monthly limit to see your daily pace. <Link to="/app/budget" className="font-bold text-leaf-700 underline">Set budget</Link></p>
            ) : (
              <>
                <p className="mt-2 text-sm text-ink-soft">{formatPesoWhole(budget.spent)} of {formatPesoWhole(budget.limit)}</p>
                <p className="mt-1 text-sm font-semibold">
                  {budget.remaining >= 0 ? `${formatPesoWhole(budget.remaining)} left` : `${formatPesoWhole(-budget.remaining)} over`}
                  {budget.safeDailySpend > 0 && <span className="text-ink-muted"> · about {formatPesoWhole(budget.safeDailySpend)}/day</span>}
                </p>
                <Link to="/app/budget" className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-leaf-700">Details <ArrowRight className="h-4 w-4" /></Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="This month">
        {[
          { label: 'Income', value: formatPeso(summary.income), icon: TrendingUp, tone: 'text-leaf-600 bg-leaf-50' },
          { label: 'Expenses', value: formatPeso(summary.expenses), icon: TrendingDown, tone: 'text-coral-600 bg-coral-50' },
          { label: 'Savings rate', value: `${summary.savingsRate}%`, icon: PiggyBank, tone: 'text-sky-600 bg-sky-50' },
          { label: 'Avg. daily spend', value: formatPeso(summary.averageDailySpend), icon: WalletIcon, tone: 'text-sun-600 bg-sun-50' },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="card p-4">
            <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}><Icon className="h-5 w-5" /></span>
            <p className="mt-3 text-sm font-semibold text-ink-muted">{label}</p>
            <p className="truncate font-display text-xl font-bold">{value}</p>
          </div>
        ))}
      </section>

      {insights.length > 0 && (
        <section aria-label="Insights" className="grid gap-3 md:grid-cols-3">
          {insights.map((i) => {
            const { box, Icon } = insightStyle[i.level];
            return (
              <div key={i.title} className="card flex gap-3 p-4">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${box}`}><Icon className="h-5 w-5" /></span>
                <div><h3 className="font-bold">{i.title}</h3><p className="mt-0.5 text-sm text-ink-soft">{i.message}</p></div>
              </div>
            );
          })}
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between"><h2 className="text-xl font-bold">Wallets</h2><Link to="/app/wallets" className="text-sm font-bold text-leaf-700">Manage</Link></div>
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
          {wallets.map((w) => (
            <Link key={w._id} to={`/app/wallets/${w._id}`} className="card min-w-[220px] snap-start p-4 transition hover:-translate-y-0.5 md:min-w-0">
              <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: w.color }} /><span className="font-bold">{w.name}</span><span className="text-xs text-ink-muted">{w.type}</span></div>
              <p className="mt-3 font-display text-2xl font-bold">{formatPeso(w.balance)}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section>
          <div className="mb-3 flex items-center justify-between"><h2 className="text-xl font-bold">Recent activity</h2><Link to="/app/transactions" className="text-sm font-bold text-leaf-700">See all</Link></div>
          <div className="card overflow-hidden">
            {recentTransactions.length === 0 ? (
              <EmptyState icon={WalletIcon} title="No transactions yet" message="Add your first income or expense to see it here." action={<Link to="/app/transactions/new" className="btn btn-primary">Add transaction</Link>} />
            ) : (
              <ul className="divide-y divide-line">{recentTransactions.map((t) => <TransactionRow key={t._id} tx={t} compact onDelete={() => undefined} />)}</ul>
            )}
          </div>
        </section>

        <section className="space-y-6">
          {topCategory && (
            <div>
              <h2 className="mb-3 text-xl font-bold">Top spending</h2>
              <div className="card flex items-center gap-4 p-4">
                <CategoryIcon icon={topCategory.category.icon} color={topCategory.category.color} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{topCategory.category.name}</p>
                  <p className="text-sm text-ink-soft">{formatPeso(topCategory.total)} · {topCategory.percentage}% of expenses</p>
                </div>
              </div>
            </div>
          )}
          <div>
            <div className="mb-3 flex items-center justify-between"><h2 className="text-xl font-bold">Savings goals</h2><Link to="/app/savings" className="text-sm font-bold text-leaf-700">See all</Link></div>
            <div className="card divide-y divide-line">
              {goals.length === 0 ? (
                <EmptyState icon={PiggyBank} title="No goals yet" message="Create a goal to start setting money aside." action={<Link to="/app/savings" className="btn btn-primary">Create goal</Link>} />
              ) : goals.map((g) => (
                <Link key={g._id} to={`/app/savings/${g._id}`} className="block p-4 transition hover:bg-paper">
                  <div className="mb-2 flex items-center justify-between gap-2"><span className="truncate font-bold">{g.title}</span><span className="text-sm font-bold text-ink-soft">{g.progress.percent}%</span></div>
                  <ProgressBar value={g.progress.percent} color={g.color} label={`${g.title} progress`} />
                  <p className="mt-2 text-xs text-ink-muted">{formatPesoWhole(g.savedAmount)} of {formatPesoWhole(g.targetAmount)}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
