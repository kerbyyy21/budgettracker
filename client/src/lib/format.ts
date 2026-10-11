const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 });
const pesoWhole = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 });

export const formatPeso = (n: number) => peso.format(n);
export const formatPesoWhole = (n: number) => pesoWhole.format(n);

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }) {
  return new Date(iso).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila', ...opts });
}

export function formatMonth(key: string) {
  const [y, m] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-PH', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export const shortMonth = (key: string) => {
  const [y, m] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-PH', { month: 'short', timeZone: 'UTC' });
};

export function shiftMonth(key: string, delta: number) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

// Today's calendar month in Manila, e.g. "2026-10".
export function currentMonth() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit' }).formatToParts(new Date());
  return `${parts.find((p) => p.type === 'year')!.value}-${parts.find((p) => p.type === 'month')!.value}`;
}

// Value for <input type="date"> in Manila time.
export function todayInput() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date());
}

export function toDateInput(iso: string) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date(iso));
}

// "2026-10-10" -> ISO at noon Manila time so the calendar day never shifts.
export const fromDateInput = (value: string) => new Date(`${value}T12:00:00+08:00`).toISOString();

export const relativeDay = (iso: string) => {
  const day = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(d);
  const today = day(new Date());
  const yesterday = day(new Date(Date.now() - 864e5));
  const d = day(new Date(iso));
  return d === today ? 'Today' : d === yesterday ? 'Yesterday' : formatDate(iso, { weekday: 'short', month: 'short', day: 'numeric' });
};
