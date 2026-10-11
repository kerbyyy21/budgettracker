// Forwards rejected promises from async route handlers to next(err).
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
