import { z } from 'zod';
import { positiveMoney } from './common';
import { todayInput } from '../lib/format';

export const transactionSchema = z.object({
  type: z.enum(['Income', 'Expense']),
  amount: positiveMoney(),
  category: z.string().min(1, 'Choose a category'),
  wallet: z.string().min(1, 'Choose a wallet'),
  paymentMethod: z.enum(['Cash', 'GCash', 'Maya', 'Bank Transfer', 'Card']),
  note: z.string().trim().max(200, 'Note must be at most 200 characters'),
  date: z
    .string()
    .min(1, 'Pick a date')
    .refine((v) => v <= todayInput(), 'Date cannot be in the future'),
});

export type TransactionForm = z.infer<typeof transactionSchema>;
