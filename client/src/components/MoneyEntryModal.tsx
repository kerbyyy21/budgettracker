import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { makeMoneyEntrySchema, type MoneyEntryForm } from '../schemas/goal';
import { toNumber } from '../schemas/common';
import { goalApi } from '../api/endpoints';
import { applyServerErrors, getErrorMessage } from '../lib/errors';
import { formatPeso } from '../lib/format';
import { useToast } from '../hooks/useToast';
import type { SavingsGoal } from '../types';
import { Modal } from './ui/Modal';
import { Field } from './ui/Field';
import { Button } from './ui/Button';

interface Props {
  open: boolean;
  mode: 'deposit' | 'withdraw';
  goal: SavingsGoal;
  availableToSave: number;
  onClose: () => void;
  onSaved: () => void;
}

// Deposit into / withdraw from a goal. The max amount comes from the same rules the API enforces.
export function MoneyEntryModal({ open, mode, goal, availableToSave, onClose, onSaved }: Props) {
  const toast = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const deposit = mode === 'deposit';
  const max = deposit ? Math.min(availableToSave, goal.progress.remaining) : goal.savedAmount;
  const schema = useMemo(() => makeMoneyEntrySchema(max, deposit ? 'deposit' : 'withdraw'), [max, deposit]);

  const { register, handleSubmit, setValue, setError, formState: { errors, isSubmitting } } = useForm<MoneyEntryForm>({
    resolver: zodResolver(schema),
    defaultValues: { amount: '', note: '' },
  });

  const submit = async (values: MoneyEntryForm) => {
    setFormError(null);
    try {
      const amount = toNumber(values.amount);
      if (deposit) await goalApi.deposit(goal._id, amount, values.note);
      else await goalApi.withdraw(goal._id, amount, values.note);
      toast.success(deposit ? `Saved ${formatPeso(amount)} to ${goal.title}` : `Moved ${formatPeso(amount)} back to your balance`);
      onSaved();
      onClose();
    } catch (err) {
      if (!applyServerErrors(err, setError, ['amount', 'note'])) setFormError(getErrorMessage(err));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`${deposit ? 'Deposit to' : 'Withdraw from'} ${goal.title}`} size="sm">
      <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
        <div className="rounded-2xl bg-leaf-50 px-4 py-3 text-sm text-leaf-800">
          {deposit ? 'You can deposit up to ' : 'Saved in this goal: '}
          <strong>{formatPeso(max)}</strong>
          {deposit && <span className="block text-leaf-700/80">Free balance {formatPeso(availableToSave)} · still needed {formatPeso(goal.progress.remaining)}</span>}
        </div>
        <Field label="Amount (₱)" htmlFor="entry-amount" error={errors.amount?.message}>
          <input id="entry-amount" inputMode="decimal" autoComplete="off" placeholder="0.00" className={`input font-display text-xl font-bold ${errors.amount ? 'input-error' : ''}`} {...register('amount')} />
        </Field>
        {max > 0 && (
          <button type="button" className="text-sm font-bold text-leaf-700 underline underline-offset-2" onClick={() => setValue('amount', String(max), { shouldValidate: true })}>
            Use maximum ({formatPeso(max)})
          </button>
        )}
        <Field label="Note (optional)" htmlFor="entry-note" error={errors.note?.message}>
          <input id="entry-note" className="input" placeholder="e.g. Allowance top-up" {...register('note')} />
        </Field>
        {formError && <p role="alert" className="rounded-2xl bg-coral-50 px-4 py-3 text-sm font-semibold text-coral-600">{formError}</p>}
        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting} disabled={max <= 0}>{deposit ? 'Deposit' : 'Withdraw'}</Button>
        </div>
      </form>
    </Modal>
  );
}
