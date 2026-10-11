import type { BudgetStatus } from '../types';

const COLORS: Record<BudgetStatus['status'], string> = { safe: '#1fa87a', near: '#f2b035', over: '#e8553d', 'no-budget': '#d9d4c4' };

interface RingProps { percent: number; color: string; size?: number; label: string; sub?: string }

export function Ring({ percent, color, size = 148, label, sub }: RingProps) {
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const shown = Math.max(0, Math.min(100, percent));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`${label} ${Math.round(percent)}%`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#ece9dd" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - shown / 100)} style={{ transition: 'stroke-dashoffset .6s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-extrabold leading-none">{Math.round(percent)}%</span>
        {sub && <span className="mt-1 text-xs font-semibold text-ink-muted">{sub}</span>}
      </div>
    </div>
  );
}

export const budgetColor = (status: BudgetStatus['status']) => COLORS[status];
