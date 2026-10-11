import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { transactionSchema, type TransactionForm as FormValues } from '../schemas/transaction';
import { toNumber } from '../schemas/common';
import { categoryApi, transactionApi, walletApi } from '../api/endpoints';
import { useFetch } from '../hooks/useFetch';
import { useToast } from '../hooks/useToast';
import { applyServerErrors, getErrorMessage } from '../lib/errors';
import { formatPeso, fromDateInput, toDateInput, todayInput } from '../lib/format';
import type { Transaction } from '../types';
import { Button } from './ui/Button';
import { Field } from './ui/Field';
import { Segmented } from './ui/Misc';
import { ErrorState, PageLoader } from './ui/StateViews';

const FIELDS = ['type', 'amount', 'category', 'wallet', 'paymentMethod', 'note', 'date'];
const METHODS = ['Cash', 'GCash', 'Maya', 'Bank Transfer', 'Card'] as const;

export function TransactionForm({ existing }: { existing?: Transaction }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [formError, setFormError] = useState<string | null>(null);

  const categories = useFetch(() => categoryApi.list(), []);
  const wallets = useFetch(() => walletApi.list(), []);

  const {
    register, handleSubmit, watch, setValue, setError, formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: existing
      ? {
          type: existing.type, amount: String(existing.amount), category: existing.category._id, wallet: existing.wallet._id,
          paymentMethod: existing.paymentMethod, note: existing.note, date: toDateInput(existing.date),
        }
      : { type: 'Expense', amount: '', category: '', wallet: '', paymentMethod: 'Cash', note: '', date: todayInput() },
  });

  const type = watch('type');
  const amountText = watch('amount');
  const walletId = watch('wallet');

  if (categories.loading || wallets.loading) return <PageLoader label="Loading form…" />;
  if (categories.error || wallets.error) {
    return <ErrorState message={categories.error ?? wallets.error ?? ''} onRetry={() => { categories.reload(); wallets.reload(); }} />;
  }

  // Derived while rendering: nothing below is stored in state.
  const typeCategories = (categories.data ?? []).filter((c) => c.type === type);
  const wallet = wallets.data?.data.find((w) => w._id === walletId);
  const typedAmount = /^\d+(\.\d{1,2})?$/.test(amountText.replace(/,/g, '')) ? toNumber(amountText) : 0;
  const undoOld = existing && existing.wallet._id === walletId ? (existing.type === 'Income' ? -existing.amount : existing.amount) : 0;
  const balanceNow = wallet ? wallet.balance + undoOld : 0;
  const balanceAfter = balanceNow + (type === 'Income' ? typedAmount : -typedAmount);

  const onSubmit = async (values: FormValues) => {
    setFormError(null);
    const payload = { ...values, amount: toNumber(values.amount), date: fromDateInput(values.date) };
    try {
      if (existing) await transactionApi.update(existing._id, payload);
      else await transactionApi.create(payload);
      toast.success(existing ? 'Transaction updated' : `${values.type} added`);
      navigate('/app/transactions');
    } catch (err) {
      if (!applyServerErrors(err, setError, FIELDS)) setFormError(getErrorMessage(err));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="card mx-auto max-w-2xl space-y-5 p-5 sm:p-8">
      <Segmented
        name="Transaction type"
        value={type}
        onChange={(v) => { setValue('type', v); setValue('category', ''); }}
        options={[{ value: 'Expense', label: 'Expense' }, { value: 'Income', label: 'Income' }]}
      />

      <Field label="Amount (₱)" htmlFor="amount" error={errors.amount?.message}>
        <input id="amount" inputMode="decimal" autoComplete="off" placeholder="0.00" aria-invalid={!!errors.amount}
          className={`input font-display text-2xl font-bold ${errors.amount ? 'input-error' : ''}`} {...register('amount')} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Category" htmlFor="category" error={errors.category?.message}>
          <select id="category" className={`input ${errors.category ? 'input-error' : ''}`} {...register('category')}>
            <option value="">Choose a category</option>
            {typeCategories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Wallet" htmlFor="wallet" error={errors.wallet?.message}>
          <select id="wallet" className={`input ${errors.wallet ? 'input-error' : ''}`} {...register('wallet')}>
            <option value="">Choose a wallet</option>
            {wallets.data?.data.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
          </select>
        </Field>
      </div>

      {wallet && (
        <div className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm ${balanceAfter < 0 ? 'bg-coral-50 text-coral-600' : 'bg-leaf-50 text-leaf-800'}`}>
          <span className="font-semibold">{wallet.name} balance</span>
          <span className="flex items-center gap-2 font-bold">
            {formatPeso(balanceNow)} <ArrowRight className="h-4 w-4" /> {formatPeso(balanceAfter)}
          </span>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Payment method" htmlFor="paymentMethod" error={errors.paymentMethod?.message}>
          <select id="paymentMethod" className="input" {...register('paymentMethod')}>
            {METHODS.map((m) => <option key={m}>{m}</option>)}
          </select>
        </Field>
        <Field label="Date" htmlFor="date" error={errors.date?.message}>
          <input id="date" type="date" max={todayInput()} className={`input ${errors.date ? 'input-error' : ''}`} {...register('date')} />
        </Field>
      </div>

      <Field label="Note (optional)" htmlFor="note" error={errors.note?.message}>
        <textarea id="note" rows={2} placeholder="e.g. Lunch with block mates" className={`input resize-none ${errors.note ? 'input-error' : ''}`} {...register('note')} />
      </Field>

      {formError && (
        <p role="alert" className="flex items-start gap-2 rounded-2xl bg-coral-50 px-4 py-3 text-sm font-semibold text-coral-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {formError}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={() => navigate('/app/transactions')}>Cancel</Button>
        <Button type="submit" loading={isSubmitting}>{existing ? 'Save changes' : `Add ${type.toLowerCase()}`}</Button>
      </div>
    </form>
  );
}
