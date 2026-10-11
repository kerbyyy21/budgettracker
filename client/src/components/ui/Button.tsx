import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'dark' | 'soft' | 'outline' | 'danger' | 'ghost';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  block?: boolean;
}

export function Button({ variant = 'primary', loading, block, className = '', children, disabled, type = 'button', ...rest }: Props) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`btn btn-${variant} ${block ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
