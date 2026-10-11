import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { walletSchema, type WalletForm } from '../schemas/wallet';
import { toNumber } from '../schemas/common';
import { walletApi } from '../api/endpoints';
import { applyServerErrors, getErrorMessage } from '../lib/errors';
import { COLOR_CHOICES } from '../lib/icons';
import { useToast } from '../hooks/useToast';
import type { Wallet } from '../types';
import { Modal } from './ui/Modal';
import { Field } from './ui/Field';
import { Button } from './ui/Button';
import { ColorPicker } from './ui/Misc';

interface Props { open: boolean; onClose: () => void; onSaved: () => void; wallet?: Wallet | null }

export function WalletFormModal({ open, onClose, onSaved, wallet }: Props) {
  const toast = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, watch, setValue, setError, formState: { errors, isSubmitting } } = useForm<WalletForm>({
    resolver: zodResolver(walletSchema),
    defaultValues: wallet
      ? { name: wallet.name, type: wallet.type, initialBalance: String(wallet.initialBalance), color: wallet.color }
      : { name: '', type: 'Cash', initialBalance: '0', color: '#1fa87a' },
  });

  const submit = async (values: WalletForm) => {
    setFormError(null);
    const payload = { ...values, initialBalance: toNumber(values.initialBalance) };
    try {
      if (wallet) await walletApi.update(wallet._id, payload);
      else await walletApi.create(payload);
      toast.success(wallet ? 'Wallet updated' : 'Wallet added');
      onSaved();
      onClose();
    } catch (err) {
      if (!applyServerErrors(err, setError, ['name', 'type', 'initialBalance', 'color'])) setFormError(getErrorMessage(err));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={wallet ? 'Edit wallet' : 'Add wallet'}>
      <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
        <Field label="Wallet name" htmlFor="wallet-name" error={errors.name?.message}>
          <input id="wallet-name" className={`input ${errors.name ? 'input-error' : ''}`} placeholder="e.g. GCash" {...register('name')} />
        </Field>
        <Field label="Type" htmlFor="wallet-type" error={errors.type?.message}>
          <select id="wallet-type" className="input" {...register('type')}>
            <option>Cash</option><option>Digital Wallet</option><option>Bank</option>
          </select>
        </Field>
        <Field label="Starting balance (₱)" htmlFor="wallet-balance" error={errors.initialBalance?.message}>
          <input id="wallet-balance" inputMode="decimal" className={`input ${errors.initialBalance ? 'input-error' : ''}`} {...register('initialBalance')} />
        </Field>
        <div>
          <span className="label">Color</span>
          <ColorPicker value={watch('color')} onChange={(c) => setValue('color', c)} choices={COLOR_CHOICES} />
        </div>
        {formError && <p role="alert" className="rounded-2xl bg-coral-50 px-4 py-3 text-sm font-semibold text-coral-600">{formError}</p>}
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>{wallet ? 'Save changes' : 'Add wallet'}</Button>
        </div>
      </form>
    </Modal>
  );
}
