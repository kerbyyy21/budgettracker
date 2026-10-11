// Round to centavos so floating point noise (0.1 + 0.2) never shows up in balances.
const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const peso = (n) =>
  '₱' + round2(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

module.exports = { round2, peso };
