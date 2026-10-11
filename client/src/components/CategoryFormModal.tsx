import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { categorySchema, type CategoryForm } from '../schemas/category';
import { categoryApi } from '../api/endpoints';
import { applyServerErrors, getErrorMessage } from '../lib/errors';
import { COLOR_CHOICES, ICON_NAMES, iconFor } from '../lib/icons';
import { useToast } from '../hooks/useToast';
import type { Category } from '../types';
import { Modal } from './ui/Modal';
import { Field } from './ui/Field';
import { Button } from './ui/Button';
import { ColorPicker, Segmented } from './ui/Misc';

interface Props { open: boolean; onClose: () => void; onSaved: () => void; category?: Category | null }

export function CategoryFormModal({ open, onClose, onSaved, category }: Props) {
  const toast = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, watch, setValue, setError, formState: { errors, isSubmitting } } = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: category
      ? { name: category.name, type: category.type, icon: category.icon, color: category.color }
      : { name: '', type: 'Expense', icon: 'tag', color: '#f97316' },
  });
  const icon = watch('icon');
  const color = watch('color');
  const locked = (category?.transactionCount ?? 0) > 0;

  const submit = async (values: CategoryForm) => {
    setFormError(null);
    try {
      if (category) await categoryApi.update(category._id, values);
      else await categoryApi.create(values);
      toast.success(category ? 'Category updated' : 'Category added');
      onSaved();
      onClose();
    } catch (err) {
      if (!applyServerErrors(err, setError, ['name', 'type', 'icon', 'color'])) setFormError(getErrorMessage(err));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={category ? 'Edit category' : 'Add category'}>
      <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
        {!locked && <Segmented name="Category type" value={watch('type')} onChange={(v) => setValue('type', v)} options={[{ value: 'Expense', label: 'Expense' }, { value: 'Income', label: 'Income' }]} />}
        <Field label="Name" htmlFor="cat-name" error={errors.name?.message}>
          <input id="cat-name" className={`input ${errors.name ? 'input-error' : ''}`} placeholder="e.g. Pets" {...register('name')} />
        </Field>
        <div>
          <span className="label">Icon</span>
          <div className="grid grid-cols-6 gap-2" role="radiogroup" aria-label="Icon">
            {ICON_NAMES.map((name) => {
              const Icon = iconFor(name);
              const selected = icon === name;
              return (
                <button key={name} type="button" role="radio" aria-checked={selected} aria-label={name} onClick={() => setValue('icon', name)}
                  className={`flex h-11 items-center justify-center rounded-xl border transition ${selected ? 'border-transparent text-white' : 'border-line bg-white text-ink-soft hover:bg-paper'}`}
                  style={selected ? { backgroundColor: color } : undefined}>
                  <Icon className="h-5 w-5" />
                </button>
              );
            })}
          </div>
          {errors.icon && <p role="alert" className="mt-1.5 text-sm font-medium text-coral-600">{errors.icon.message}</p>}
        </div>
        <div>
          <span className="label">Color</span>
          <ColorPicker value={color} onChange={(c) => setValue('color', c)} choices={COLOR_CHOICES} />
        </div>
        {formError && <p role="alert" className="rounded-2xl bg-coral-50 px-4 py-3 text-sm font-semibold text-coral-600">{formError}</p>}
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>{category ? 'Save changes' : 'Add category'}</Button>
        </div>
      </form>
    </Modal>
  );
}
