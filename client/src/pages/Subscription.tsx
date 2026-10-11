import { useState } from 'react';
import { Check, Crown, Sparkles } from 'lucide-react';
import { profileApi } from '../api/endpoints';
import { useFetch } from '../hooks/useFetch';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import { getErrorMessage } from '../lib/errors';
import { formatDate, formatPesoWhole } from '../lib/format';
import type { BillingCycle, Plan } from '../types';
import { Badge, PageHeader, Segmented } from '../components/ui/Misc';
import { Button } from '../components/ui/Button';
import { ErrorState, PageLoader } from '../components/ui/StateViews';

export default function Subscription() {
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const plans = useFetch(() => profileApi.plans(), []);
  const profile = useFetch(() => profileApi.get(), []);
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [busy, setBusy] = useState<Plan | null>(null);

  if ((plans.loading || profile.loading) && !plans.data) return <PageLoader label="Loading plans…" />;
  if (plans.error || profile.error || !plans.data || !profile.data) return <ErrorState message={plans.error ?? profile.error ?? 'No data'} onRetry={() => { plans.reload(); profile.reload(); }} />;

  const current = profile.data;
  const sub = current.subscription;

  const choose = async (plan: Plan) => {
    const downgrade = plan === 'Basic';
    const startsTrial = plans.data!.trialAvailable && !downgrade && current.plan === 'Basic';
    const ok = await confirm({
      title: downgrade ? 'Switch to Basic?' : `Choose ${plan}?`,
      message: downgrade ? 'You will be limited to one wallet.' : startsTrial ? `You get ${plans.data!.trialDays} days free, then billing starts. This demo does not charge real money.` : `Your plan will change to ${plan} (${cycle}). This demo does not charge real money.`,
      confirmLabel: downgrade ? 'Switch to Basic' : startsTrial ? 'Start free trial' : `Choose ${plan}`,
    });
    if (!ok) return;
    setBusy(plan);
    try {
      const updated = await profileApi.subscribe(plan, cycle);
      toast.success(updated.message ?? `You are on ${plan}`);
      profile.reload();
      plans.reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <PageHeader title="Subscription" subtitle="Pick the plan that fits how many wallets you manage." />

      <section className="rise mb-6 rounded-3xl bg-ink p-6 text-white shadow-pop sm:p-8">
        <div className="flex flex-wrap items-center gap-3"><Crown className="h-6 w-6 text-sun-500" /><h2 className="text-2xl font-extrabold">{current.plan} plan</h2>{sub.trialActive && <Badge tone="sun">Trial · {sub.trialDaysLeft} day{sub.trialDaysLeft === 1 ? '' : 's'} left</Badge>}</div>
        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-3">
          <div><dt className="text-white/60">Wallets used</dt><dd className="font-display text-xl font-bold">{sub.walletsUsed}{sub.walletLimit === null ? ' (unlimited)' : ` of ${sub.walletLimit}`}</dd></div>
          <div><dt className="text-white/60">Price</dt><dd className="font-display text-xl font-bold">{sub.price === 0 ? 'Free' : `${formatPesoWhole(sub.price)}/${current.billingCycle === 'yearly' ? 'yr' : 'mo'}`}</dd></div>
          <div><dt className="text-white/60">{sub.trialActive ? 'Trial ends' : 'Renews on'}</dt><dd className="font-display text-xl font-bold">{sub.renewsOn ? formatDate(sub.renewsOn) : '—'}</dd></div>
        </dl>
      </section>

      <div className="mb-6 max-w-xs"><Segmented name="Billing cycle" value={cycle} onChange={setCycle} options={[{ value: 'monthly', label: 'Monthly' }, { value: 'yearly', label: 'Yearly' }]} /></div>

      <div className="grid gap-5 md:grid-cols-3">
        {plans.data.data.map((p) => {
          const isCurrent = p.name === current.plan && (p.name === 'Basic' || current.billingCycle === cycle);
          const price = cycle === 'yearly' ? p.yearly : p.monthly;
          const featured = p.name === 'Plus';
          return (
            <article key={p.name} className={`flex flex-col rounded-3xl p-6 ${featured ? 'bg-leaf-600 text-white shadow-pop' : 'card'}`}>
              <div className="flex items-center justify-between"><h2 className="text-xl font-bold">{p.name}</h2>{featured && <Badge tone="sun"><Sparkles className="h-3 w-3" /> Popular</Badge>}</div>
              <p className="mt-4 font-display text-4xl font-extrabold">{price === 0 ? 'Free' : formatPesoWhole(price)}<span className={`text-base font-semibold ${featured ? 'text-white/70' : 'text-ink-muted'}`}>{price === 0 ? '' : cycle === 'yearly' ? '/yr' : '/mo'}</span></p>
              <p className={`mt-1 min-h-[1.25rem] text-sm font-semibold ${featured ? 'text-sun-100' : 'text-leaf-700'}`}>{cycle === 'yearly' && p.yearlySavings.amount > 0 ? `Save ${formatPesoWhole(p.yearlySavings.amount)} (${p.yearlySavings.percent}%) a year` : ''}</p>
              <ul className="mt-5 flex-1 space-y-2.5 text-sm font-semibold">
                {p.features.map((f) => <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 shrink-0" /> {f}</li>)}
              </ul>
              <Button className="mt-6" variant={featured ? 'dark' : 'primary'} disabled={isCurrent} loading={busy === p.name} onClick={() => choose(p.name)}>
                {isCurrent ? 'Current plan' : p.name === 'Basic' ? 'Switch to Basic' : plans.data!.trialAvailable && current.plan === 'Basic' ? `Try ${p.name} free` : `Choose ${p.name}`}
              </Button>
            </article>
          );
        })}
      </div>
      {dialog}
    </div>
  );
}
