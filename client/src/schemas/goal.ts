import { z } from 'zod';
import { hexColor, positiveMoney, toNumber } from './common';
import { todayInput } from '../lib/format';

export const goalSchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(60, 'Title must be at most 60 characters'),
  targetAmount: positiveMoney('Target amount is required'),
  targetDate: z.string().refine((v) => v === '' || v > todayInput(), 'Target date must be in the future'),
  color: hexColor,
});

export type GoalForm = z.infer<typeof goalSchema>;

// Deposit / withdraw form. `max` is the most the user can move right now.
export const makeMoneyEntrySchema = (max: number, label: string) =>
  z.object({
    amount: positiveMoney().refine((v) => toNumber(v) <= max, `You can only ${label} up to ${max.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}`),
    note: z.string().trim().max(120, 'Note must be at most 120 characters'),
  });

export type MoneyEntryForm = z.infer<ReturnType<typeof makeMoneyEntrySchema>>;
