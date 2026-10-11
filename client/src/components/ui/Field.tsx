import type { ReactNode } from 'react';

interface Props {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

// Label + input slot + per-field error message.
export function Field({ label, htmlFor, error, hint, children }: Props) {
  return (
    <div>
      <label htmlFor={htmlFor} className="label">{label}</label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-ink-muted">{hint}</p>}
      {error && <p id={`${htmlFor}-error`} role="alert" className="mt-1.5 text-sm font-medium text-coral-600">{error}</p>}
    </div>
  );
}
