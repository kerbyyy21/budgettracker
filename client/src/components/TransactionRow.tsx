import { Link } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import type { Transaction } from '../types';
import { CategoryIcon } from './ui/Misc';
import { formatPeso, relativeDay } from '../lib/format';

interface Props {
  tx: Transaction;
  onDelete: (tx: Transaction) => void;
  compact?: boolean;
}

export function TransactionRow({ tx, onDelete, compact }: Props) {
  const isIncome = tx.type === 'Income';
  return (
    <li className="flex items-center gap-3 px-4 py-3 sm:gap-4">
      <CategoryIcon icon={tx.category.icon} color={tx.category.color} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{tx.note || tx.category.name}</p>
        <p className="truncate text-sm text-ink-muted">
          {tx.note ? `${tx.category.name} · ` : ''}{tx.wallet.name} · {relativeDay(tx.date)}
        </p>
      </div>
      <p className={`shrink-0 text-right font-display text-base font-bold sm:text-lg ${isIncome ? 'text-leaf-600' : 'text-coral-600'}`}>
        {isIncome ? '+' : '−'}{formatPeso(tx.amount)}
      </p>
      {!compact && (
        <div className="flex shrink-0 gap-0.5">
          <Link to={`/app/transactions/${tx._id}/edit`} aria-label={`Edit ${tx.note || tx.category.name}`} className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-muted hover:bg-paper-deep hover:text-ink">
            <Pencil className="h-4 w-4" />
          </Link>
          <button onClick={() => onDelete(tx)} aria-label={`Delete ${tx.note || tx.category.name}`} className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-muted hover:bg-coral-50 hover:text-coral-600">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </li>
  );
}
