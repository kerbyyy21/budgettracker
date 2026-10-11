import { LayoutDashboard, ArrowLeftRight, Wallet, Tags, Target, PiggyBank, BarChart3, Crown, UserRound, type LucideIcon } from 'lucide-react';

export interface NavItem { to: string; label: string; icon: LucideIcon; end?: boolean }

export const NAV_ITEMS: NavItem[] = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/app/wallets', label: 'Wallets', icon: Wallet },
  { to: '/app/categories', label: 'Categories', icon: Tags },
  { to: '/app/budget', label: 'Budget', icon: Target },
  { to: '/app/savings', label: 'Savings goals', icon: PiggyBank },
  { to: '/app/reports', label: 'Reports', icon: BarChart3 },
  { to: '/app/subscription', label: 'Subscription', icon: Crown },
  { to: '/app/profile', label: 'Profile', icon: UserRound },
];
