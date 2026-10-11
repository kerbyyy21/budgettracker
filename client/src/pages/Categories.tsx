import { useState } from 'react';
import { Lock, Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import { categoryApi } from '../api/endpoints';
import { useFetch } from '../hooks/useFetch';
import { useConfirm } from '../hooks/useConfirm';
import { useToast } from '../hooks/useToast';
import { getErrorMessage } from '../lib/errors';
import type { Category, TxType } from '../types';
import { Badge, CategoryIcon, PageHeader, Segmented } from '../components/ui/Misc';
import { Button } from '../components/ui/Button';
import { EmptyState, ErrorState, PageLoader } from '../components/ui/StateViews';
import { CategoryFormModal } from '../components/CategoryFormModal';

export default function Categories() {
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const [tab, setTab] = useState<TxType>('Expense');
  const [editing, setEditing] = useState<Category | 'new' | null>(null);
  const { data, loading, error, reload } = useFetch(() => categoryApi.list(), []);

  if (loading && !data) return <PageLoader label="Loading categories…" />;
  if (error || !data) return <ErrorState message={error ?? 'No data'} onRetry={reload} />;

  const visible = data.filter((c) => c.type === tab);

  const handleDelete = async (c: Category) => {
    if (!(await confirm({ title: `Delete "${c.name}"?`, message: 'Categories that are used by transactions cannot be deleted.' }))) return;
    try {
      await categoryApi.remove(c._id);
      toast.success('Category deleted');
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader title="Categories" subtitle="Group your income and spending your way."
        actions={<Button onClick={() => setEditing('new')}><Plus className="h-5 w-5" /> Add category</Button>} />
      <div className="mb-5 max-w-sm">
        <Segmented name="Category type" value={tab} onChange={setTab} options={[{ value: 'Expense', label: 'Expenses' }, { value: 'Income', label: 'Income' }]} />
      </div>

      {visible.length === 0 ? (
        <div className="card"><EmptyState icon={Tags} title="No categories here" message="Add a category to organize your transactions." action={<Button onClick={() => setEditing('new')}>Add category</Button>} /></div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((c) => (
            <article key={c._id} className="card flex items-center gap-3 p-4">
              <CategoryIcon icon={c.icon} color={c.color} />
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-bold">{c.name}</h2>
                <p className="text-sm text-ink-muted">{c.transactionCount ?? 0} transaction{c.transactionCount === 1 ? '' : 's'}</p>
              </div>
              {c.isDefault ? (
                <Badge><Lock className="h-3 w-3" /> Default</Badge>
              ) : (
                <div className="flex gap-0.5">
                  <button onClick={() => setEditing(c)} aria-label={`Edit ${c.name}`} className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-muted hover:bg-paper-deep"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(c)} aria-label={`Delete ${c.name}`} className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-muted hover:bg-coral-50 hover:text-coral-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {editing && <CategoryFormModal key={editing === 'new' ? 'new' : editing._id} open onClose={() => setEditing(null)} onSaved={reload} category={editing === 'new' ? null : editing} />}
      {dialog}
    </div>
  );
}
