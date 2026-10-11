export type TxType = 'Income' | 'Expense';
export type PaymentMethod = 'Cash' | 'GCash' | 'Maya' | 'Bank Transfer' | 'Card';
export type WalletType = 'Cash' | 'Digital Wallet' | 'Bank';
export type Plan = 'Basic' | 'Plus' | 'Premium';
export type BillingCycle = 'monthly' | 'yearly';

export interface Category {
  _id: string;
  name: string;
  type: TxType;
  icon: string;
  color: string;
  isDefault: boolean;
  transactionCount?: number;
}

export interface WalletRef { _id: string; name: string; type: WalletType; color: string }
export interface CategoryRef { _id: string; name: string; type: TxType; icon: string; color: string }

export interface Wallet extends WalletRef {
  initialBalance: number;
  isDefault: boolean;
  income: number;
  expenses: number;
  balance: number;
  transactionCount?: number;
}

export interface Transaction {
  _id: string;
  type: TxType;
  amount: number;
  category: CategoryRef;
  wallet: WalletRef;
  paymentMethod: PaymentMethod;
  note: string;
  date: string;
}

export interface Paginated<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; pages: number };
  totals: { income: number; expenses: number; net: number };
}

export interface WalletList {
  data: Wallet[];
  totalBalance: number;
  plan: Plan;
  walletLimit: number | null;
  canAddMore: boolean;
}

export interface BudgetStatus {
  month: string;
  limit: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  status: 'safe' | 'near' | 'over' | 'no-budget';
  daysLeft: number;
  safeDailySpend: number;
  projectedSpend: number;
  willExceed: boolean;
  carriedFrom: string | null;
}

export interface Budget { _id: string; month: string; monthlyLimit: number }

export interface GoalProgress {
  percent: number;
  remaining: number;
  daysLeft: number | null;
  requiredPerMonth: number | null;
  status: 'active' | 'completed' | 'overdue';
}

export interface SavingsGoal {
  _id: string;
  title: string;
  targetAmount: number;
  savedAmount: number;
  targetDate: string | null;
  color: string;
  progress: GoalProgress;
}

export interface SavingsEntry { _id: string; type: 'Deposit' | 'Withdrawal'; amount: number; note: string; date: string }
export interface SavingsGoalDetail extends SavingsGoal { entries: SavingsEntry[]; availableToSave: number }

export interface SavingsList {
  data: SavingsGoal[];
  totals: { totalTarget: number; totalSaved: number; completed: number; availableToSave: number };
}

export interface MonthSummary {
  month: string;
  income: number;
  expenses: number;
  net: number;
  savingsRate: number;
  transactionCount: number;
  expenseCount: number;
  averageExpense: number;
  averageDailySpend: number;
  largestExpense?: { _id: string; amount: number; date: string; note: string; category: CategoryRef } | null;
  smallestExpense?: { _id: string; amount: number; date: string; note: string; category: CategoryRef } | null;
}

export interface BreakdownRow {
  rank: number;
  category: CategoryRef;
  total: number;
  count: number;
  average: number;
  percentage: number;
}

export interface TrendRow { month: string; income: number; expenses: number; net: number; expenseChange: number | null }

export interface Insight { level: 'info' | 'warning' | 'success'; title: string; message: string }

export interface Dashboard {
  user: { name: string; plan: Plan };
  month: string;
  money: { totalBalance: number; totalSaved: number; available: number };
  summary: MonthSummary;
  budget: BudgetStatus;
  topCategory: BreakdownRow | null;
  wallets: Wallet[];
  recentTransactions: Transaction[];
  goals: SavingsGoal[];
  insights: Insight[];
}

export interface Subscription {
  walletLimit: number | null;
  price: number;
  trialActive: boolean;
  trialDaysLeft: number;
  renewsOn: string | null;
  walletsUsed: number;
}

export interface Profile {
  _id: string;
  name: string;
  email: string;
  plan: Plan;
  billingCycle: BillingCycle;
  subscription: Subscription;
  message?: string;
}

export interface PlanInfo {
  name: Plan;
  walletLimit: number | null;
  monthly: number;
  yearly: number;
  features: string[];
  yearlySavings: { amount: number; percent: number };
}

export interface PlansResponse {
  current: { plan: Plan; billingCycle: BillingCycle };
  trialAvailable: boolean;
  trialDays: number;
  data: PlanInfo[];
}
