import type { ReactNode } from 'react';
import { iconFor } from '../../lib/icons';

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-ink-soft">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

const badgeTones = {
  green: 'bg-leaf-100 text-leaf-800',
  coral: 'bg-coral-100 text-coral-600',
  sun: 'bg-sun-100 text-sun-600',
  sky: 'bg-sky-100 text-sky-600',
  gray: 'bg-paper-deep text-ink-soft',
};

export function Badge({ tone = 'gray', children }: { tone?: keyof typeof badgeTones; children: ReactNode }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${badgeTones[tone]}`}>{children}</span>;
}

export function ProgressBar({ value, color = '#1fa87a', label }: { value: number; color?: string; label: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-paper-deep" role="progressbar" aria-label={label} aria-valuenow={Math.round(clamped)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${clamped}%`, backgroundColor: color }} />
    </div>
  );
}

export function CategoryIcon({ icon, color, size = 'md' }: { icon: string; color: string; size?: 'sm' | 'md' | 'lg' }) {
  const Icon = iconFor(icon);
  const box = size === 'sm' ? 'h-9 w-9 rounded-xl' : size === 'lg' ? 'h-14 w-14 rounded-2xl' : 'h-11 w-11 rounded-2xl';
  const glyph = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-7 w-7' : 'h-5 w-5';
  return (
    <span className={`flex shrink-0 items-center justify-center ${box}`} style={{ backgroundColor: `${color}1f`, color }}>
      <Icon className={glyph} />
    </span>
  );
}

export function Segmented<T extends string>({ value, onChange, options, name }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; name: string }) {
  return (
    <div role="radiogroup" aria-label={name} className="grid auto-cols-fr grid-flow-col gap-1 rounded-2xl bg-paper-deep p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`min-h-[40px] rounded-xl px-3 text-sm font-bold transition ${value === o.value ? 'bg-white text-ink shadow-sm' : 'text-ink-muted hover:text-ink'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ColorPicker({ value, onChange, choices }: { value: string; onChange: (v: string) => void; choices: string[] }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Color">
      {choices.map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={value === c}
          aria-label={c}
          onClick={() => onChange(c)}
          className={`h-9 w-9 rounded-full border-2 transition ${value === c ? 'scale-110 border-ink' : 'border-white ring-1 ring-line'}`}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  );
}
