import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftRight, ChevronLeft, ChevronRight, Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import { categoryApi, transactionApi, walletApi, type TransactionQuery } from '../api/endpoints';
import { useFetch } from '../hooks/useFetch';
import { useDebounce } from '../hooks/useDebounce';
import { useConfirm } from '../hooks/useConfirm';
import { useToast } from '../hooks/useToast';
import { getErrorMessage } from '../lib/errors';
import { formatPeso, relativeDay } from '../lib/format';
import type { Transaction } from '../types';
import { PageHeader, Segmented } from '../components/ui/Misc';
import { Button } from '../components/ui/Button';
import { EmptyState, ErrorState, PageLoader } from '../components/ui/StateViews';
import { TransactionRow } from '../components/TransactionRow';

const SORTS: Record<string, { label: string; sort: string; order: string }> = {
  newest: { label: 'Newest first', sort: 'date', order: 'desc' },
  oldest: { label: 'Oldest first', sort: 'date', order: 'asc' },
  highest: { label: 'Highest amount', sort: 'amount', order: 'desc' },
  lowest: { label: 'Lowest amount', sort: 'amount', order: 'asc' },
};

interface Filters { q: string; type: '' | 'Income' | 'Expense'; month: string; wallet: string; category: string; sort: string; minAmount: string; maxAmount: string }
const EMPTY: Filters = { q: '', type: '', month: '', wallet: '', category: '', sort: 'newest', minAmount: '', maxAmount: '' };

export default function Transactions() {
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [page, setPage] = useState(1);
  const [showMore, setShowMore] = useState(false);

  const q = useDebounce(filters.q);
  const sort = SORTS[filters.sort];
  const query: TransactionQuery = {
    q, type: filters.type, month: filters.month, wallet: filters.wallet, category: filters.category,
    minAmount: filters.minAmount, maxAmount: filters.maxAmount, sort: sort.sort, order: sort.order, page, limit: 15,
  };

  const list = useFetch((signal) => transactionApi.list(query, signal), [JSON.stringify(query)]);
  const wallets = useFetch(() => walletApi.list(), []);
  const categories = useFetch(() => categoryApi.list(), []);

  const update = (patch: Partial<Filters>) => { setFilters((f) => ({ ...f, ...patch })); setPage(1); };
  const activeCount = [filters.q, filters.type, filters.month, filters.wallet, filters.category, filters.minAmount, filters.maxAmount].filter(Boolean).length;

  const handleDelete = async (tx: Transaction) => {
    const ok = await confirm({
      title: 'Delete transaction?',
      message: `${tx.note || tx.category.name} (${formatPeso(tx.amount)}) will be removed and your ${tx.wallet.name} balance will be adjusted.`,
    });
    if (!ok) return;
    try {
      await transactionApi.remove(tx._id);
      toast.success('Transaction deleted');
      list.reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  // Group rows by day for display (computed during render).
  const groups: { label: string; items: Transaction[] }[] = [];
  for (const tx of list.data?.data ?? []) {
    const label = relativeDay(tx.date);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(tx);
    else groups.push({ label, items: [tx] });
  }

  const select = 'input !min-h-[44px] !py-2';

  return (
    <div>
      <PageHeader title="Transactions" subtitle="Search, filter and sort everything you have logged."
        actions={<Link to="/app/transactions/new" className="btn btn-primary"><Plus className="h-5 w-5" /> Add transaction</Link>} />

      <div className="card mb-4 space-y-3 p-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted" aria-hidden />
            <input aria-label="Search transactions" className="input !pl-11" placeholder="Search note or category" value={filters.q} onChange={(e) => update({ q: e.target.value })} />
          </div>
          <Button variant={showMore ? 'dark' : 'outline'} onClick={() => setShowMore((s) => !s)} aria-expanded={showMore} aria-label="Toggle more filters">
            <SlidersHorizontal className="h-5 w-5" /> <span className="hidden sm:inline">Filters{activeCount ? ` (${activeCount})` : ''}</span>
          </Button>
        </div>
        <Segmented name="Type" value={filters.type} onChange={(type) => update({ type })}
          options={[{ value: '', label: 'All' }, { value: 'Income', label: 'Income' }, { value: 'Expense', label: 'Expenses' }]} />
        {showMore && (
          <div className="grid gap-3 border-t border-line pt-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm font-semibold text-ink-soft">Month
              <input type="month" className={`${select} mt-1`} value={filters.month} onChange={(e) => update({ month: e.target.value })} />
            </label>
            <label className="text-sm font-semibold text-ink-soft">Wallet
              <select className={`${select} mt-1`} value={filters.wallet} onChange={(e) => update({ wallet: e.target.value })}>
                <option value="">All wallets</option>
                {wallets.data?.data.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold text-ink-soft">Category
              <select className={`${select} mt-1`} value={filters.category} onChange={(e) => update({ category: e.target.value })}>
                <option value="">All categories</option>
                {categories.data?.filter((c) => !filters.type || c.type === filters.type).map((c) => <option key={c._id} value={c._id}>{c.name} ({c.type})</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold text-ink-soft">Min amount
              <input inputMode="decimal" className={`${select} mt-1`} placeholder="0" value={filters.minAmount} onChange={(e) => update({ minAmount: e.target.value })} />
            </label>
            <label className="text-sm font-semibold text-ink-soft">Max amount
              <input inputMode="decimal" className={`${select} mt-1`} placeholder="Any" value={filters.maxAmount} onChange={(e) => update({ maxAmount: e.target.value })} />
            </label>
            <label className="text-sm font-semibold text-ink-soft">Sort by
              <select className={`${select} mt-1`} value={filters.sort} onChange={(e) => update({ sort: e.target.value })}>
                {Object.entries(SORTS).map(([key, s]) => <option key={key} value={key}>{s.label}</option>)}
              </select>
            </label>
          </div>
        )}
        {activeCount > 0 && (
          <button onClick={() => { setFilters(EMPTY); setPage(1); }} className="inline-flex items-center gap-1 text-sm font-bold text-coral-600"><X className="h-4 w-4" /> Clear all filters</button>
        )}
      </div>

      {list.loading && !list.data ? (
        <PageLoader label="Loading transactions…" />
      ) : list.error ? (
        <ErrorState message={list.error} onRetry={list.reload} />
      ) : list.data && (
        <div className={list.loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          <div className="mb-4 grid grid-cols-3 gap-2 sm:gap-3" aria-label="Totals for current filters">
            <div className="card p-3 sm:p-4"><p className="text-xs font-semibold text-ink-muted sm:text-sm">Income</p><p className="truncate font-display text-sm font-bold text-leaf-600 sm:text-xl">{formatPeso(list.data.totals.income)}</p></div>
            <div className="card p-3 sm:p-4"><p className="text-xs font-semibold text-ink-muted sm:text-sm">Expenses</p><p className="truncate font-display text-sm font-bold text-coral-600 sm:text-xl">{formatPeso(list.data.totals.expenses)}</p></div>
            <div className="card p-3 sm:p-4"><p className="text-xs font-semibold text-ink-muted sm:text-sm">Net</p><p className="truncate font-display text-sm font-bold sm:text-xl">{formatPeso(list.data.totals.net)}</p></div>
          </div>

          {list.data.data.length === 0 ? (
            <div className="card">
              <EmptyState icon={ArrowLeftRight}
                title={activeCount ? 'No matching transactions' : 'No transactions yet'}
                message={activeCount ? 'Try removing a filter or searching for something else.' : 'Log your first income or expense and it will show up here.'}
                action={activeCount ? <Button variant="soft" onClick={() => { setFilters(EMPTY); setPage(1); }}>Clear filters</Button> : <Link to="/app/transactions/new" className="btn btn-primary">Add transaction</Link>} />
            </div>
          ) : (
            <div className="space-y-4">
              {groups.map((g) => (
                <section key={g.label}>
                  <h2 className="mb-2 px-1 text-sm font-bold uppercase tracking-wide text-ink-muted">{g.label}</h2>
                  <ul className="card divide-y divide-line overflow-hidden">
                    {g.items.map((tx) => <TransactionRow key={tx._id} tx={tx} onDelete={handleDelete} />)}
                  </ul>
                </section>
              ))}
            </div>
          )}

          {list.data.pagination.pages > 1 && (
            <nav className="mt-6 flex items-center justify-between gap-3" aria-label="Pagination">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /> Previous</Button>
              <span className="text-sm font-semibold text-ink-soft">Page {list.data.pagination.page} of {list.data.pagination.pages}</span>
              <Button variant="outline" disabled={page >= list.data.pagination.pages} onClick={() => setPage((p) => p + 1)}>Next <ChevronRight className="h-4 w-4" /></Button>
            </nav>
          )}
        </div>
      )}
      {dialog}
    </div>
  );
}
