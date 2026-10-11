import { z } from 'zod';

const MAX_AMOUNT = 100_000_000;

export const toNumber = (value: string) => Number(value.replace(/,/g, ''));

const moneyText = (required: string) =>
  z
    .string()
    .trim()
    .min(1, required)
    .refine((v) => /^\d+(\.\d{1,2})?$/.test(v.replace(/,/g, '')), 'Enter a valid amount (up to 2 decimals)')
    .refine((v) => toNumber(v) <= MAX_AMOUNT, 'Amount is too large');

// Money that must be more than zero (transactions, goals, budgets).
export const positiveMoney = (required = 'Amount is required') =>
  moneyText(required).refine((v) => toNumber(v) > 0, 'Amount must be greater than zero');

// Money that may be zero (starting balances).
export const nonNegativeMoney = (required = 'Amount is required') => moneyText(required);

export const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Pick a color');
