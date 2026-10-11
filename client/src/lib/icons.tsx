import {
  Utensils, Bus, GraduationCap, Smartphone, ShoppingBag, Receipt, Home, HeartPulse, Clapperboard,
  TriangleAlert, Wallet, Briefcase, Clock, Store, Gift, PiggyBank, Coffee, Car, Plane, BookOpen,
  Dumbbell, PawPrint, Tag, type LucideIcon,
} from 'lucide-react';

// Must match CATEGORY_ICONS on the server.
export const ICONS: Record<string, LucideIcon> = {
  utensils: Utensils, bus: Bus, 'graduation-cap': GraduationCap, smartphone: Smartphone, 'shopping-bag': ShoppingBag,
  receipt: Receipt, home: Home, 'heart-pulse': HeartPulse, clapperboard: Clapperboard, 'triangle-alert': TriangleAlert,
  wallet: Wallet, briefcase: Briefcase, clock: Clock, store: Store, gift: Gift, 'piggy-bank': PiggyBank, coffee: Coffee,
  car: Car, plane: Plane, 'book-open': BookOpen, dumbbell: Dumbbell, 'paw-print': PawPrint, tag: Tag,
};

export const ICON_NAMES = Object.keys(ICONS);
export const iconFor = (name: string): LucideIcon => ICONS[name] ?? Tag;

export const COLOR_CHOICES = ['#f97316', '#e8553d', '#ec4899', '#a855f7', '#6366f1', '#3b6fd8', '#0891b2', '#14b8a6', '#1fa87a', '#65a30d', '#f2b035', '#92400e'];
