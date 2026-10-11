import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, Pencil, Plus, Trash2, Wallet as WalletIcon } from 'lucide-react';
import { walletApi } from '../api/endpoints';
import { useFetch } from '../hooks/useFetch';
import { useConfirm } from '../hooks/useConfirm';
import { useToast } from '../hooks/useToast';
import { getErrorMessage } from '../lib/errors';
import { formatPeso } from '../lib/format';
import type { Wallet } from '../types';
import { Badge, PageHeader } from '../components/ui/Misc';
import { Button } from '../components/ui/Button';
import { EmptyState, ErrorState, PageLoader } from '../components/ui/StateViews';
import { WalletFormModal } from '../components/WalletFormModal';

export default function Wallets() {
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const { data, loading, error, reload } = useFetch(() => walletApi.list(), []);
  const [editing, setEditing] = useState<Wallet | 'new' | null>(null);

  if (loading && !data) return <PageLoader label="Loading wallets…" />;
  if (error || !data) return <ErrorState message={error ?? 'No data'} onRetry={reload} />;

  const handleDelete = async (w: Wallet) => {
    if (!(await confirm({ title: `Delete ${w.name}?`, message: 'This wallet will be removed. Wallets that still have transactions cannot be deleted.' }))) return;
    try {
      await walletApi.remove(w._id);
      toast.success('Wallet deleted');
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const limitText = data.walletLimit === null ? 'Unlimited wallets' : `${data.data.length} of ${data.walletLimit} wallets used`;

  return (
    <div>
      <PageHeader title="Wallets" subtitle={`${limitText} on the ${data.plan} plan.`}
        actions={data.canAddMore
          ? <Button onClick={() => setEditing('new')}><Plus className="h-5 w-5" /> Add wallet</Button>
          : <Link to="/app/subscription" className="btn btn-dark"><Crown className="h-5 w-5" /> Upgrade for more</Link>} />

      <div className="rise mb-6 rounded-3xl bg-ink p-6 text-white shadow-pop">
        <p className="text-sm font-semibold text-leaf-300">Total across wallets</p>
        <p className="mt-1 font-display text-4xl font-extrabold">{formatPeso(data.totalBalance)}</p>
      </div>

      {data.data.length === 0 ? (
        <div className="card"><EmptyState icon={WalletIcon} title="No wallets yet" message="Add a wallet such as Cash or GCash to start tracking." action={<Button onClick={() => setEditing('new')}>Add wallet</Button>} /></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.data.map((w) => (
            <article key={w._id} className="card flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: w.color }}><WalletIcon className="h-5 w-5" /></span>
                  <div className="min-w-0"><h2 className="truncate text-lg font-bold">{w.name}</h2><p className="text-sm text-ink-muted">{w.type}</p></div>
                </div>
                {w.isDefault && <Badge tone="green">Default</Badge>}
              </div>
              <p className="mt-4 font-display text-3xl font-bold">{formatPeso(w.balance)}</p>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div><dt className="text-ink-muted">In</dt><dd className="font-bold text-leaf-600">{formatPeso(w.income)}</dd></div>
                <div><dt className="text-ink-muted">Out</dt><dd className="font-bold text-coral-600">{formatPeso(w.expenses)}</dd></div>
              </dl>
              <div className="mt-5 flex gap-2 border-t border-line pt-4">
                <Link to={`/app/wallets/${w._id}`} className="btn btn-soft flex-1">View activity</Link>
                <button onClick={() => setEditing(w)} aria-label={`Edit ${w.name}`} className="flex h-11 w-11 items-center justify-center rounded-xl text-ink-muted hover:bg-paper-deep"><Pencil className="h-4 w-4" /></button>
                {!w.isDefault && <button onClick={() => handleDelete(w)} aria-label={`Delete ${w.name}`} className="flex h-11 w-11 items-center justify-center rounded-xl text-ink-muted hover:bg-coral-50 hover:text-coral-600"><Trash2 className="h-4 w-4" /></button>}
              </div>
            </article>
          ))}
        </div>
      )}

      {editing && <WalletFormModal key={editing === 'new' ? 'new' : editing._id} open onClose={() => setEditing(null)} onSaved={reload} wallet={editing === 'new' ? null : editing} />}
      {dialog}
    </div>
  );
}
