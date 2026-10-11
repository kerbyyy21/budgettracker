export function Logo({ dark = false, className = '' }: { dark?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 font-display text-xl font-extrabold ${dark ? 'text-white' : 'text-ink'} ${className}`}>
      <svg viewBox="0 0 64 64" className="h-9 w-9" aria-hidden>
        <rect width="64" height="64" rx="16" fill={dark ? '#1fa87a' : '#0f2a24'} />
        <path d="M20 40c0 4 4 7 12 7s12-3 12-8-5-6-12-8-12-3-12-8 5-7 12-7 12 3 12 7" fill="none" stroke={dark ? '#0f2a24' : '#74d9b3'} strokeWidth="5" strokeLinecap="round" />
        <circle cx="48" cy="14" r="5" fill="#f2b035" />
      </svg>
      BudgetTracker
    </span>
  );
}
