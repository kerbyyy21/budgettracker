import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownToLine, Pencil, PiggyBank, Plus, Trash2, PartyPopper } from 'lucide-react';
import { goalApi } from '../api/endpoints';
import { useFetch } from '../hooks/useFetch';
import { useConfirm } from '../hooks/useConfirm';
import { useToast } from '../hooks/useToast';
import { getErrorMessage } from '../lib/errors';
import { formatDate, formatPeso, formatPesoWhole } from '../lib/format';
import type { SavingsGoal } from '../types';
import { Badge, PageHeader, ProgressBar } from '../components/ui/Misc';
import { Button } from '../components/ui/Button';
import { EmptyState, ErrorState, PageLoader } from '../components/ui/StateViews';
import { GoalFormModal } from '../components/GoalFormModal';
import { MoneyEntryModal } from '../components/MoneyEntryModal';

export default function Savings() {
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const { data, loading, error, reload } = useFetch(() => goalApi.list(), []);
  const [editing, setEditing] = useState<SavingsGoal | 'new' | null>(null);
  const [depositing, setDepositing] = useState<SavingsGoal | null>(null);

  if (loading && !data) return <PageLoader label="Loading savings goals…" />;
  if (error || !data) return <ErrorState message={error ?? 'No data'} onRetry={reload} />;

  const { totals } = data;
  const overall = totals.totalTarget > 0 ? Math.round((totals.totalSaved / totals.totalTarget) * 100) : 0;

  const handleDelete = async (g: SavingsGoal) => {
    const ok = await confirm({ title: `Delete "${g.title}"?`, message: `${formatPeso(g.savedAmount)} saved in this goal will go back to your available balance.` });
    if (!ok) return;
    try {
      await goalApi.remove(g._id);
      toast.success('Goal deleted');
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader title="Savings goals" subtitle="Set money aside for what matters." actions={<Button onClick={() => setEditing('new')}><Plus className="h-5 w-5" /> New goal</Button>} />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rise rounded-3xl bg-ink p-5 text-white sm:col-span-1"><p className="text-sm font-semibold text-leaf-300">Saved so far</p><p className="mt-1 font-display text-3xl font-extrabold">{formatPeso(totals.totalSaved)}</p><p className="mt-1 text-sm text-white/60">{overall}% of {formatPesoWhole(totals.totalTarget)} in targets</p></div>
        <div className="card p-5"><p className="text-sm font-semibold text-ink-muted">Free to save</p><p className="mt-1 font-display text-3xl font-bold">{formatPeso(totals.availableToSave)}</p><p className="mt-1 text-sm text-ink-muted">Balance not yet set aside</p></div>
        <div className="card p-5"><p className="text-sm font-semibold text-ink-muted">Goals reached</p><p className="mt-1 font-display text-3xl font-bold">{totals.completed} <span className="text-lg text-ink-muted">of {data.data.length}</span></p></div>
      </div>

      {data.data.length === 0 ? (
        <div className="card"><EmptyState icon={PiggyBank} title="No savings goals yet" message="Create a goal like a new laptop or an emergency fund and start putting money toward it." action={<Button onClick={() => setEditing('new')}>Create a goal</Button>} /></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.data.map((g) => {
            const done = g.progress.status === 'completed';
            return (
              <article key={g._id} className="card flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <Link to={`/app/savings/${g._id}`} className="min-w-0 hover:underline"><h2 className="truncate text-xl font-bold">{g.title}</h2></Link>
                  {done ? <Badge tone="green"><PartyPopper className="h-3 w-3" /> Reached</Badge> : g.progress.status === 'overdue' ? <Badge tone="coral">Past due</Badge> : null}
                </div>
                <p className="mt-3 font-display text-3xl font-bold">{formatPeso(g.savedAmount)}</p>
                <p className="mb-3 text-sm text-ink-muted">of {formatPeso(g.targetAmount)} · {g.progress.percent}%</p>
                <ProgressBar value={g.progress.percent} color={g.color} label={`${g.title} progress`} />
                <p className="mt-3 min-h-[2.5rem] text-sm text-ink-soft">
                  {done ? 'You hit this goal. Nice work!' : g.progress.requiredPerMonth !== null
                    ? `Save about ${formatPesoWhole(g.progress.requiredPerMonth)} a month to reach it by ${formatDate(g.targetDate!)}.`
                    : `${formatPesoWhole(g.progress.remaining)} to go.`}
                </p>
                <div className="mt-4 flex gap-2 border-t border-line pt-4">
                  <Button variant="soft" className="flex-1" disabled={done} onClick={() => setDepositing(g)}><ArrowDownToLine className="h-4 w-4" /> Deposit</Button>
                  <button onClick={() => setEditing(g)} aria-label={`Edit ${g.title}`} className="flex h-11 w-11 items-center justify-center rounded-xl text-ink-muted hover:bg-paper-deep"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(g)} aria-label={`Delete ${g.title}`} className="flex h-11 w-11 items-center justify-center rounded-xl text-ink-muted hover:bg-coral-50 hover:text-coral-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {editing && <GoalFormModal key={editing === 'new' ? 'new' : editing._id} open onClose={() => setEditing(null)} onSaved={reload} goal={editing === 'new' ? null : editing} />}
      {depositing && <MoneyEntryModal key={depositing._id} open mode="deposit" goal={depositing} availableToSave={totals.availableToSave} onClose={() => setDepositing(null)} onSaved={reload} />}
      {dialog}
    </div>
  );
}
