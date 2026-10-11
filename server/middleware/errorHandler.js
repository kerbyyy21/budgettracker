const HttpError = require('../utils/HttpError');

// Central error handler. Always responds with { message, errors? }.
// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message, ...(err.errors && { errors: err.errors }) });
  }

  if (err.name === 'ValidationError') {
    const errors = {};
    Object.entries(err.errors).forEach(([field, e]) => { errors[field] = e.message; });
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: `Invalid value for "${err.path}": ${err.value}` });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'value';
    return res.status(409).json({ message: `A record with that ${field} already exists` });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Malformed JSON in request body' });
  }

  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
};
