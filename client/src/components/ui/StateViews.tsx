import type { ReactNode } from 'react';
import { AlertTriangle, Loader2, type LucideIcon } from 'lucide-react';
import { Button } from './Button';

export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-ink-muted" role="status">
      <Loader2 className="h-8 w-8 animate-spin text-leaf-600" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry, title = 'Something went wrong' }: { message: string; onRetry?: () => void; title?: string }) {
  return (
    <div className="card mx-auto flex max-w-md flex-col items-center gap-3 px-6 py-10 text-center" role="alert">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-coral-50 text-coral-600">
        <AlertTriangle className="h-7 w-7" />
      </span>
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="text-sm text-ink-soft">{message}</p>
      {onRetry && <Button variant="dark" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

interface EmptyProps {
  icon: LucideIcon;
  title: string;
  message: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, message, action }: EmptyProps) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-leaf-50 text-leaf-600">
        <Icon className="h-8 w-8" />
      </span>
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="max-w-sm text-sm text-ink-soft">{message}</p>
      {action}
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-paper-deep ${className}`} aria-hidden />;
}
