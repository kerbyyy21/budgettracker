import { z } from 'zod';
import { positiveMoney } from './common';

export const budgetSchema = z.object({
  monthlyLimit: positiveMoney('Monthly budget is required'),
});

export type BudgetForm = z.infer<typeof budgetSchema>;
