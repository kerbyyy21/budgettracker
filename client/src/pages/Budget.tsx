import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Target } from 'lucide-react';
import { budgetApi, reportApi } from '../api/endpoints';
import { budgetSchema, type BudgetForm } from '../schemas/budget';
import { toNumber } from '../schemas/common';
import { useFetch } from '../hooks/useFetch';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import { applyServerErrors, getErrorMessage } from '../lib/errors';
import { currentMonth, formatMonth, formatPeso, formatPesoWhole } from '../lib/format';
import { Badge, PageHeader, ProgressBar } from '../components/ui/Misc';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { ErrorState, PageLoader } from '../components/ui/StateViews';
import { MonthSwitcher } from '../components/MonthSwitcher';
import { Ring, budgetColor } from '../components/BudgetRing';

function BudgetEditor({ month, current, onSaved, onRemoved }: { month: string; current: number; onSaved: () => void; onRemoved: () => void }) {
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<BudgetForm>({
    resolver: zodResolver(budgetSchema),
    defaultValues: { monthlyLimit: current > 0 ? String(current) : '' },
  });

  const submit = async (values: BudgetForm) => {
    setFormError(null);
    try {
      await budgetApi.save(month, toNumber(values.monthlyLimit));
      toast.success(`Budget for ${formatMonth(month)} saved`);
      onSaved();
    } catch (err) {
      if (!applyServerErrors(err, setError, ['monthlyLimit'])) setFormError(getErrorMessage(err));
    }
  };

  const remove = async () => {
    if (!(await confirm({ title: 'Remove this budget?', message: `${formatMonth(month)} will fall back to the previous month's limit.`, confirmLabel: 'Remove' }))) return;
    try {
      await budgetApi.remove(month);
      toast.success('Budget removed');
      onRemoved();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="card space-y-4 p-5">
      <h2 className="text-lg font-bold">Budget for {formatMonth(month)}</h2>
      <Field label="Monthly limit (₱)" htmlFor="monthlyLimit" error={errors.monthlyLimit?.message}>
        <input id="monthlyLimit" inputMode="decimal" placeholder="e.g. 10000" className={`input font-display text-xl font-bold ${errors.monthlyLimit ? 'input-error' : ''}`} {...register('monthlyLimit')} />
      </Field>
      {formError && <p role="alert" className="rounded-2xl bg-coral-50 px-4 py-3 text-sm font-semibold text-coral-600">{formError}</p>}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" loading={isSubmitting} className="flex-1">Save budget</Button>
        {current > 0 && <Button variant="outline" onClick={remove}>Remove</Button>}
      </div>
      {dialog}
    </form>
  );
}

export default function Budget() {
  const [month, setMonth] = useState(currentMonth());
  const status = useFetch(() => budgetApi.status(month), [month]);
  const budgets = useFetch(() => budgetApi.list(), []);
  const trend = useFetch(() => reportApi.trend(6), []);

  const reloadAll = () => { status.reload(); budgets.reload(); trend.reload(); };

  // Budget history: pair each month's spending with that month's limit (computed during render).
  const history = (trend.data ?? []).map((row) => {
    const limit = budgets.data?.find((b) => b.month === row.month)?.monthlyLimit ?? 0;
    return { ...row, limit, percent: limit > 0 ? Math.round((row.expenses / limit) * 100) : 0 };
  }).reverse();

  const s = status.data;
  const tone = s?.status === 'over' ? 'coral' : s?.status === 'near' ? 'sun' : 'green';
  const label = s ? { safe: 'On track', near: 'Close to limit', over: 'Over budget', 'no-budget': 'No budget' }[s.status] : '';
  const hasOwnBudget = !!budgets.data?.some((b) => b.month === month);

  return (
    <div>
      <PageHeader title="Budget" subtitle="Set a monthly limit and see how your spending is pacing." actions={<MonthSwitcher month={month} onChange={setMonth} allowFuture />} />

      {status.loading && !s ? <PageLoader label="Checking your budget…" /> : status.error || !s ? <ErrorState message={status.error ?? 'No data'} onRetry={status.reload} /> : (
        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-5">
            <section className="card p-5 sm:p-7">
              <div className="flex flex-col items-center gap-6 sm:flex-row">
                <Ring percent={s.percentUsed} color={budgetColor(s.status)} size={176} label="Budget used" sub="of budget" />
                <div className="w-full min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-bold">{formatMonth(s.month)}</h2><Badge tone={tone}>{label}</Badge></div>
                  {s.status === 'no-budget' ? (
                    <p className="mt-3 text-ink-soft">No budget yet. Set a monthly limit to start tracking your pace.</p>
                  ) : (
                    <dl className="mt-4 grid grid-cols-2 gap-4">
                      <div><dt className="text-sm text-ink-muted">Spent</dt><dd className="font-display text-2xl font-bold">{formatPeso(s.spent)}</dd></div>
                      <div><dt className="text-sm text-ink-muted">Limit</dt><dd className="font-display text-2xl font-bold">{formatPeso(s.limit)}</dd></div>
                      <div><dt className="text-sm text-ink-muted">{s.remaining >= 0 ? 'Left' : 'Over by'}</dt><dd className={`font-display text-2xl font-bold ${s.remaining < 0 ? 'text-coral-600' : 'text-leaf-600'}`}>{formatPeso(Math.abs(s.remaining))}</dd></div>
                      <div><dt className="text-sm text-ink-muted">Days left</dt><dd className="font-display text-2xl font-bold">{s.daysLeft}</dd></div>
                    </dl>
                  )}
                  {s.carriedFrom && <p className="mt-3 text-xs text-ink-muted">Using the limit carried from {formatMonth(s.carriedFrom)}.</p>}
                </div>
              </div>
            </section>

            {s.status !== 'no-budget' && (
              <section className="grid gap-3 sm:grid-cols-2">
                <div className="card p-5"><p className="text-sm font-semibold text-ink-muted">Safe to spend per day</p><p className="font-display text-3xl font-bold">{formatPeso(s.safeDailySpend)}</p><p className="mt-1 text-xs text-ink-muted">Remaining budget divided by days left</p></div>
                <div className={`card p-5 ${s.willExceed && s.status !== 'over' ? '!border-sun-500' : ''}`}><p className="text-sm font-semibold text-ink-muted">Projected month-end spend</p><p className="font-display text-3xl font-bold">{formatPeso(s.projectedSpend)}</p><p className="mt-1 text-xs text-ink-muted">{s.willExceed ? 'At this pace you will go over your limit.' : 'At this pace you will stay within your limit.'}</p></div>
              </section>
            )}

            <section className="card p-5">
              <h2 className="mb-4 text-lg font-bold">Last 6 months</h2>
              {trend.loading && !trend.data ? <PageLoader label="Loading history…" /> : trend.error ? <ErrorState message={trend.error} onRetry={trend.reload} /> : (
                <ul className="space-y-4">
                  {history.map((h) => (
                    <li key={h.month}>
                      <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm"><span className="font-bold">{formatMonth(h.month)}</span><span className="text-ink-muted">{formatPesoWhole(h.expenses)}{h.limit > 0 ? ` of ${formatPesoWhole(h.limit)}` : ' · no budget'}</span></div>
                      <ProgressBar value={h.percent} color={h.percent >= 100 ? '#e8553d' : h.percent >= 80 ? '#f2b035' : '#1fa87a'} label={`${formatMonth(h.month)} budget used`} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <div>
            <BudgetEditor key={`${month}-${s.limit}`} month={month} current={hasOwnBudget ? s.limit : 0} onSaved={reloadAll} onRemoved={reloadAll} />
            <p className="mt-4 flex gap-2 rounded-2xl bg-sun-50 p-4 text-sm text-ink-soft"><Target className="mt-0.5 h-4 w-4 shrink-0 text-sun-600" /> You will see a warning at 80% of your limit and again when you go over.</p>
          </div>
        </div>
      )}
    </div>
  );
}
