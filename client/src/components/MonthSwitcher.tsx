import { ChevronLeft, ChevronRight } from 'lucide-react';
import { currentMonth, formatMonth, shiftMonth } from '../lib/format';

interface Props { month: string; onChange: (month: string) => void; allowFuture?: boolean }

export function MonthSwitcher({ month, onChange, allowFuture = false }: Props) {
  const isLatest = !allowFuture && month >= currentMonth();
  return (
    <div className="inline-flex items-center gap-1 rounded-2xl border border-line bg-white p-1 shadow-sm">
      <button onClick={() => onChange(shiftMonth(month, -1))} aria-label="Previous month" className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-paper-deep"><ChevronLeft className="h-5 w-5" /></button>
      <span className="min-w-[8.5rem] text-center text-sm font-bold" aria-live="polite">{formatMonth(month)}</span>
      <button onClick={() => onChange(shiftMonth(month, 1))} disabled={isLatest} aria-label="Next month" className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-paper-deep disabled:opacity-30 disabled:hover:bg-transparent"><ChevronRight className="h-5 w-5" /></button>
    </div>
  );
}
