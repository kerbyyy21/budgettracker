import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { goalSchema, type GoalForm } from '../schemas/goal';
import { toNumber } from '../schemas/common';
import { goalApi } from '../api/endpoints';
import { applyServerErrors, getErrorMessage } from '../lib/errors';
import { COLOR_CHOICES } from '../lib/icons';
import { toDateInput } from '../lib/format';
import { useToast } from '../hooks/useToast';
import type { SavingsGoal } from '../types';
import { Modal } from './ui/Modal';
import { Field } from './ui/Field';
import { Button } from './ui/Button';
import { ColorPicker } from './ui/Misc';

interface Props { open: boolean; onClose: () => void; onSaved: () => void; goal?: SavingsGoal | null }

export function GoalFormModal({ open, onClose, onSaved, goal }: Props) {
  const toast = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, watch, setValue, setError, formState: { errors, isSubmitting } } = useForm<GoalForm>({
    resolver: zodResolver(goalSchema),
    defaultValues: goal
      ? { title: goal.title, targetAmount: String(goal.targetAmount), targetDate: goal.targetDate ? toDateInput(goal.targetDate) : '', color: goal.color }
      : { title: '', targetAmount: '', targetDate: '', color: '#3b6fd8' },
  });

  const submit = async (values: GoalForm) => {
    setFormError(null);
    const payload = {
      title: values.title,
      targetAmount: toNumber(values.targetAmount),
      targetDate: values.targetDate ? new Date(`${values.targetDate}T12:00:00+08:00`).toISOString() : null,
      color: values.color,
    };
    try {
      if (goal) await goalApi.update(goal._id, payload);
      else await goalApi.create(payload);
      toast.success(goal ? 'Goal updated' : 'Goal created');
      onSaved();
      onClose();
    } catch (err) {
      if (!applyServerErrors(err, setError, ['title', 'targetAmount', 'targetDate', 'color'])) setFormError(getErrorMessage(err));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={goal ? 'Edit savings goal' : 'New savings goal'}>
      <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
        <Field label="Goal name" htmlFor="goal-title" error={errors.title?.message}>
          <input id="goal-title" className={`input ${errors.title ? 'input-error' : ''}`} placeholder="e.g. New laptop" {...register('title')} />
        </Field>
        <Field label="Target amount (₱)" htmlFor="goal-target" error={errors.targetAmount?.message}>
          <input id="goal-target" inputMode="decimal" className={`input ${errors.targetAmount ? 'input-error' : ''}`} placeholder="0.00" {...register('targetAmount')} />
        </Field>
        <Field label="Target date (optional)" htmlFor="goal-date" error={errors.targetDate?.message} hint="We'll work out how much to save each month.">
          <input id="goal-date" type="date" className={`input ${errors.targetDate ? 'input-error' : ''}`} {...register('targetDate')} />
        </Field>
        <div>
          <span className="label">Color</span>
          <ColorPicker value={watch('color')} onChange={(c) => setValue('color', c)} choices={COLOR_CHOICES} />
        </div>
        {formError && <p role="alert" className="rounded-2xl bg-coral-50 px-4 py-3 text-sm font-semibold text-coral-600">{formError}</p>}
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>{goal ? 'Save changes' : 'Create goal'}</Button>
        </div>
      </form>
    </Modal>
  );
}
