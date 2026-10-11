import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowDownToLine, ArrowLeft, ArrowUpFromLine, History, Pencil, Trash2 } from 'lucide-react';
import { goalApi } from '../api/endpoints';
import { useFetch } from '../hooks/useFetch';
import { useConfirm } from '../hooks/useConfirm';
import { useToast } from '../hooks/useToast';
import { getErrorMessage } from '../lib/errors';
import { formatDate, formatPeso } from '../lib/format';
import { Badge, PageHeader } from '../components/ui/Misc';
import { Button } from '../components/ui/Button';
import { EmptyState, ErrorState, PageLoader } from '../components/ui/StateViews';
import { Ring } from '../components/BudgetRing';
import { GoalFormModal } from '../components/GoalFormModal';
import { MoneyEntryModal } from '../components/MoneyEntryModal';

export default function SavingsDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const { data, loading, error, notFound, reload } = useFetch(() => goalApi.get(id), [id]);
  const [modal, setModal] = useState<'edit' | 'deposit' | 'withdraw' | null>(null);

  const back = <Link to="/app/savings" className="mb-3 inline-flex items-center gap-1.5 text-sm font-bold text-ink-soft hover:text-ink"><ArrowLeft className="h-4 w-4" /> Savings goals</Link>;

  if (loading && !data) return <div>{back}<PageLoader label="Loading goal…" /></div>;
  if (notFound) return <div>{back}<ErrorState title="Goal not found" message="This savings goal no longer exists." /></div>;
  if (error || !data) return <div>{back}<ErrorState message={error ?? 'No data'} onRetry={reload} /></div>;

  const done = data.progress.status === 'completed';

  const handleDelete = async () => {
    if (!(await confirm({ title: `Delete "${data.title}"?`, message: `${formatPeso(data.savedAmount)} will go back to your available balance.` }))) return;
    try {
      await goalApi.remove(data._id);
      toast.success('Goal deleted');
      navigate('/app/savings');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div>
      {back}
      <PageHeader title={data.title} subtitle={data.targetDate ? `Target date ${formatDate(data.targetDate)}` : 'No target date'}
        actions={<><Button variant="outline" onClick={() => setModal('edit')}><Pencil className="h-4 w-4" /> Edit</Button><Button variant="outline" onClick={handleDelete}><Trash2 className="h-4 w-4" /> Delete</Button></>} />

      <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        <section className="card flex flex-col items-center gap-5 p-6 text-center">
          <Ring percent={data.progress.percent} color={data.color} size={190} label="Goal progress" sub="saved" />
          <div>
            <p className="font-display text-3xl font-bold">{formatPeso(data.savedAmount)}</p>
            <p className="text-ink-muted">of {formatPeso(data.targetAmount)}</p>
          </div>
          {done ? <Badge tone="green">Goal reached</Badge> : data.progress.status === 'overdue' && <Badge tone="coral">Past the target date</Badge>}
          <div className="grid w-full grid-cols-2 gap-3 text-left">
            <div className="rounded-2xl bg-paper p-3.5"><p className="text-xs font-semibold text-ink-muted">Still needed</p><p className="font-display text-lg font-bold">{formatPeso(data.progress.remaining)}</p></div>
            <div className="rounded-2xl bg-paper p-3.5"><p className="text-xs font-semibold text-ink-muted">{data.progress.requiredPerMonth !== null ? 'Save per month' : 'Days left'}</p><p className="font-display text-lg font-bold">{data.progress.requiredPerMonth !== null ? formatPeso(data.progress.requiredPerMonth) : data.progress.daysLeft ?? '—'}</p></div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row">
            <Button className="flex-1" disabled={done} onClick={() => setModal('deposit')}><ArrowDownToLine className="h-4 w-4" /> Deposit</Button>
            <Button variant="outline" className="flex-1" disabled={data.savedAmount <= 0} onClick={() => setModal('withdraw')}><ArrowUpFromLine className="h-4 w-4" /> Withdraw</Button>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-bold">History</h2>
          <div className="card overflow-hidden">
            {data.entries.length === 0 ? (
              <EmptyState icon={History} title="No deposits yet" message="Make your first deposit to start building this goal." />
            ) : (
              <ul className="divide-y divide-line">
                {data.entries.map((e) => (
                  <li key={e._id} className="flex items-center gap-3 px-4 py-3.5">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${e.type === 'Deposit' ? 'bg-leaf-50 text-leaf-600' : 'bg-coral-50 text-coral-600'}`}>{e.type === 'Deposit' ? <ArrowDownToLine className="h-5 w-5" /> : <ArrowUpFromLine className="h-5 w-5" />}</span>
                    <div className="min-w-0 flex-1"><p className="font-bold">{e.type}</p><p className="truncate text-sm text-ink-muted">{e.note || 'No note'} · {formatDate(e.date)}</p></div>
                    <p className={`font-display font-bold ${e.type === 'Deposit' ? 'text-leaf-600' : 'text-coral-600'}`}>{e.type === 'Deposit' ? '+' : '−'}{formatPeso(e.amount)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {modal === 'edit' && <GoalFormModal open onClose={() => setModal(null)} onSaved={reload} goal={data} />}
      {(modal === 'deposit' || modal === 'withdraw') && <MoneyEntryModal open mode={modal} goal={data} availableToSave={data.availableToSave} onClose={() => setModal(null)} onSaved={reload} />}
      {dialog}
    </div>
  );
}
