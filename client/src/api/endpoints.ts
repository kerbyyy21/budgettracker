import { api } from '../lib/api';
import type {
  Budget, BudgetStatus, BreakdownRow, Category, Dashboard, Insight, MonthSummary, Paginated, PlansResponse,
  Profile, SavingsEntry, SavingsGoal, SavingsGoalDetail, SavingsList, TrendRow, Transaction, TxType, Wallet, WalletList,
} from '../types';

// Payloads sent to the API (what the forms produce after conversion).
export interface TransactionPayload {
  type: TxType;
  amount: number;
  category: string;
  wallet: string;
  paymentMethod: string;
  note: string;
  date: string;
}
export interface WalletPayload { name: string; type: string; initialBalance: number; color: string }
export interface CategoryPayload { name: string; type: TxType; icon: string; color: string }
export interface GoalPayload { title: string; targetAmount: number; targetDate: string | null; color: string }

export interface TransactionQuery {
  page?: number; limit?: number; type?: string; category?: string; wallet?: string; paymentMethod?: string;
  month?: string; from?: string; to?: string; minAmount?: string; maxAmount?: string; q?: string; sort?: string; order?: string;
}

const clean = <T extends object>(params: T) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null));

export const dashboardApi = {
  get: () => api.get<Dashboard>('/dashboard').then((r) => r.data),
};

export const transactionApi = {
  list: (params: TransactionQuery, signal?: AbortSignal) =>
    api.get<Paginated<Transaction>>('/transactions', { params: clean(params), signal }).then((r) => r.data),
  get: (id: string) => api.get<Transaction>(`/transactions/${id}`).then((r) => r.data),
  create: (body: TransactionPayload) => api.post<Transaction>('/transactions', body).then((r) => r.data),
  update: (id: string, body: TransactionPayload) => api.put<Transaction>(`/transactions/${id}`, body).then((r) => r.data),
  remove: (id: string) => api.delete(`/transactions/${id}`).then((r) => r.data),
};

export const walletApi = {
  list: () => api.get<WalletList>('/wallets').then((r) => r.data),
  get: (id: string) => api.get<Wallet>(`/wallets/${id}`).then((r) => r.data),
  create: (body: WalletPayload) => api.post<Wallet>('/wallets', body).then((r) => r.data),
  update: (id: string, body: WalletPayload) => api.put<Wallet>(`/wallets/${id}`, body).then((r) => r.data),
  remove: (id: string) => api.delete(`/wallets/${id}`).then((r) => r.data),
};

export const categoryApi = {
  list: (type?: TxType) => api.get<{ data: Category[] }>('/categories', { params: clean({ type }) }).then((r) => r.data.data),
  create: (body: CategoryPayload) => api.post<Category>('/categories', body).then((r) => r.data),
  update: (id: string, body: CategoryPayload) => api.put<Category>(`/categories/${id}`, body).then((r) => r.data),
  remove: (id: string) => api.delete(`/categories/${id}`).then((r) => r.data),
};

export const budgetApi = {
  list: () => api.get<{ data: Budget[] }>('/budgets').then((r) => r.data.data),
  status: (month: string) => api.get<BudgetStatus>('/budgets/status', { params: { month } }).then((r) => r.data),
  save: (month: string, monthlyLimit: number) => api.put<Budget>(`/budgets/${month}`, { monthlyLimit }).then((r) => r.data),
  remove: (month: string) => api.delete(`/budgets/${month}`).then((r) => r.data),
};

export const goalApi = {
  list: () => api.get<SavingsList>('/savings-goals').then((r) => r.data),
  get: (id: string) => api.get<SavingsGoalDetail>(`/savings-goals/${id}`).then((r) => r.data),
  create: (body: GoalPayload) => api.post<SavingsGoal>('/savings-goals', body).then((r) => r.data),
  update: (id: string, body: GoalPayload) => api.put<SavingsGoal>(`/savings-goals/${id}`, body).then((r) => r.data),
  remove: (id: string) => api.delete(`/savings-goals/${id}`).then((r) => r.data),
  deposit: (id: string, amount: number, note: string) =>
    api.post<{ goal: SavingsGoal; entry: SavingsEntry }>(`/savings-goals/${id}/deposit`, { amount, note }).then((r) => r.data),
  withdraw: (id: string, amount: number, note: string) =>
    api.post<{ goal: SavingsGoal; entry: SavingsEntry }>(`/savings-goals/${id}/withdraw`, { amount, note }).then((r) => r.data),
};

export const reportApi = {
  summary: (month: string, wallet?: string) => api.get<MonthSummary>('/reports/summary', { params: clean({ month, wallet }) }).then((r) => r.data),
  breakdown: (month: string, type: TxType, wallet?: string) =>
    api.get<{ month: string; type: TxType; total: number; data: BreakdownRow[] }>('/reports/category-breakdown', { params: clean({ month, type, wallet }) }).then((r) => r.data),
  trend: (months: number, wallet?: string) => api.get<{ data: TrendRow[] }>('/reports/monthly-trend', { params: clean({ months, wallet }) }).then((r) => r.data.data),
  insights: (month: string) => api.get<{ data: Insight[] }>('/reports/insights', { params: { month } }).then((r) => r.data.data),
};

export const profileApi = {
  get: () => api.get<Profile>('/profile').then((r) => r.data),
  update: (body: { name: string; email: string }) => api.put<Profile>('/profile', body).then((r) => r.data),
  plans: () => api.get<PlansResponse>('/profile/plans').then((r) => r.data),
  subscribe: (plan: string, billingCycle: string) => api.post<Profile>('/profile/subscribe', { plan, billingCycle }).then((r) => r.data),
};
