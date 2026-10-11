const ApiError = require('./ApiError');

// "Today" is calculated in the app's local time zone (default Philippines, UTC+8)
// but dates are STORED as UTC midnight of the calendar day, so month grouping is stable.
const TZ_OFFSET_MINUTES = Number(process.env.TZ_OFFSET_MINUTES ?? 480);

const localNow = () => new Date(Date.now() + TZ_OFFSET_MINUTES * 60000);

const pad = (n) => String(n).padStart(2, '0');

const currentMonth = () => {
  const d = localNow();
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
};

// Today's calendar day as a UTC-midnight Date (same convention as stored transaction dates)
const todayUtc = () => {
  const d = localNow();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

const parseMonth = (value) => {
  const month = value || currentMonth();
  if (!MONTH_RE.test(month)) throw new ApiError(400, 'Month must be in YYYY-MM format, e.g. 2026-10');
  return month;
};

// [start, end) range in UTC for a "YYYY-MM" string
const monthRange = (month) => {
  const [y, m] = month.split('-').map(Number);
  return { start: new Date(Date.UTC(y, m - 1, 1)), end: new Date(Date.UTC(y, m, 1)) };
};

const daysInMonth = (month) => {
  const { start, end } = monthRange(month);
  return Math.round((end - start) / 86400000);
};

const shiftMonth = (month, delta) => {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
};

const addDays = (date, days) => new Date(date.getTime() + days * 86400000);

const addMonths = (date, months) => {
  const d = new Date(date);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
};

// Parses "YYYY-MM-DD" or ISO strings; throws 400 when the value is not a real date
const parseDate = (value, label = 'Date') => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new ApiError(400, `${label} is not a valid date`);
  return d;
};

module.exports = {
  currentMonth, todayUtc, parseMonth, monthRange, daysInMonth, shiftMonth, addDays, addMonths, parseDate, localNow,
};
