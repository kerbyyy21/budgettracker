import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowLeftRight } from 'lucide-react';
import { transactionApi, walletApi } from '../api/endpoints';
import { useFetch } from '../hooks/useFetch';
import { formatPeso } from '../lib/format';
import { PageHeader } from '../components/ui/Misc';
import { EmptyState, ErrorState, PageLoader } from '../components/ui/StateViews';
import { TransactionRow } from '../components/TransactionRow';

export default function WalletDetail() {
  const { id = '' } = useParams();
  const wallet = useFetch(() => walletApi.get(id), [id]);
  const txs = useFetch((signal) => transactionApi.list({ wallet: id, limit: 50 }, signal), [id]);

  return (
    <div>
      <Link to="/app/wallets" className="mb-3 inline-flex items-center gap-1.5 text-sm font-bold text-ink-soft hover:text-ink"><ArrowLeft className="h-4 w-4" /> Wallets</Link>
      {wallet.loading ? (
        <PageLoader label="Loading wallet…" />
      ) : wallet.notFound ? (
        <ErrorState title="Wallet not found" message="This wallet no longer exists." />
      ) : wallet.error || !wallet.data ? (
        <ErrorState message={wallet.error ?? 'No data'} onRetry={wallet.reload} />
      ) : (
        <>
          <PageHeader title={wallet.data.name} subtitle={`${wallet.data.type} · started with ${formatPeso(wallet.data.initialBalance)}`} />
          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            <div className="card p-5"><p className="text-sm font-semibold text-ink-muted">Balance</p><p className="font-display text-3xl font-bold">{formatPeso(wallet.data.balance)}</p></div>
            <div className="card p-5"><p className="text-sm font-semibold text-ink-muted">Money in</p><p className="font-display text-3xl font-bold text-leaf-600">{formatPeso(wallet.data.income)}</p></div>
            <div className="card p-5"><p className="text-sm font-semibold text-ink-muted">Money out</p><p className="font-display text-3xl font-bold text-coral-600">{formatPeso(wallet.data.expenses)}</p></div>
          </div>
          <h2 className="mb-3 text-xl font-bold">Activity</h2>
          {txs.loading ? <PageLoader label="Loading activity…" /> : txs.error ? <ErrorState message={txs.error} onRetry={txs.reload} /> : (
            <div className="card overflow-hidden">
              {txs.data && txs.data.data.length > 0 ? (
                <ul className="divide-y divide-line">{txs.data.data.map((t) => <TransactionRow key={t._id} tx={t} compact onDelete={() => undefined} />)}</ul>
              ) : (
                <EmptyState icon={ArrowLeftRight} title="No activity in this wallet" message="Transactions you log with this wallet will appear here." action={<Link to="/app/transactions/new" className="btn btn-primary">Add transaction</Link>} />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
