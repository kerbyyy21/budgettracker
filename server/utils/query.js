const mongoose = require('mongoose');
const HttpError = require('./HttpError');
const { isValidMonthKey, monthKey } = require('../services/finance');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function objectId(value, name) {
  if (!mongoose.isValidObjectId(value)) throw new HttpError(400, `Invalid ${name}: "${value}"`);
  return new mongoose.Types.ObjectId(value);
}

function monthParam(value) {
  if (value === undefined || value === '') return monthKey(new Date());
  if (!isValidMonthKey(value)) throw new HttpError(400, 'month must look like 2026-10');
  return value;
}

function amountParam(value, name = 'amount') {
  const n = Number(value);
  if (value === undefined || value === null || value === '' || !Number.isFinite(n)) {
    throw new HttpError(400, 'Validation failed', { [name]: 'Amount is required and must be a number' });
  }
  if (n <= 0) throw new HttpError(400, 'Validation failed', { [name]: 'Amount must be greater than zero' });
  if (n > 100000000) throw new HttpError(400, 'Validation failed', { [name]: 'Amount is too large' });
  return Math.round(n * 100) / 100;
}

function pick(body, fields) {
  const out = {};
  for (const f of fields) if (body[f] !== undefined) out[f] = body[f];
  return out;
}

module.exports = { escapeRegex, objectId, monthParam, amountParam, pick };
