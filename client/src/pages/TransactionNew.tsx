import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '../components/ui/Misc';
import { TransactionForm } from '../components/TransactionForm';

export default function TransactionNew() {
  return (
    <div>
      <Link to="/app/transactions" className="mb-3 inline-flex items-center gap-1.5 text-sm font-bold text-ink-soft hover:text-ink"><ArrowLeft className="h-4 w-4" /> Transactions</Link>
      <PageHeader title="Add transaction" subtitle="Record money coming in or going out." />
      <TransactionForm />
    </div>
  );
}
