import { z } from 'zod';
import { hexColor, nonNegativeMoney } from './common';

export const walletSchema = z.object({
  name: z.string().trim().min(1, 'Wallet name is required').max(30, 'Wallet name must be at most 30 characters'),
  type: z.enum(['Cash', 'Digital Wallet', 'Bank']),
  initialBalance: nonNegativeMoney('Starting balance is required'),
  color: hexColor,
});

export type WalletForm = z.infer<typeof walletSchema>;
