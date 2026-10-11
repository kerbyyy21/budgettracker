import { z } from 'zod';
import { hexColor } from './common';

export const categorySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(30, 'Name must be at most 30 characters'),
  type: z.enum(['Income', 'Expense']),
  icon: z.string().min(1, 'Pick an icon'),
  color: hexColor,
});

export type CategoryForm = z.infer<typeof categorySchema>;
