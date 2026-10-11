import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { transactionApi } from '../api/endpoints';
import { useFetch } from '../hooks/useFetch';
import { PageHeader } from '../components/ui/Misc';
import { TransactionForm } from '../components/TransactionForm';
import { ErrorState, PageLoader } from '../components/ui/StateViews';

export default function TransactionEdit() {
  const { id = '' } = useParams();
  const { data, loading, error, notFound, reload } = useFetch(() => transactionApi.get(id), [id]);

  return (
    <div>
      <Link to="/app/transactions" className="mb-3 inline-flex items-center gap-1.5 text-sm font-bold text-ink-soft hover:text-ink"><ArrowLeft className="h-4 w-4" /> Transactions</Link>
      <PageHeader title="Edit transaction" subtitle="Changes update your wallet balance right away." />
      {loading ? (
        <PageLoader label="Loading transaction…" />
      ) : notFound ? (
        <ErrorState title="Transaction not found" message="It may have been deleted already." />
      ) : error || !data ? (
        <ErrorState message={error ?? 'No data'} onRetry={reload} />
      ) : (
        <TransactionForm key={data._id} existing={data} />
      )}
    </div>
  );
}
