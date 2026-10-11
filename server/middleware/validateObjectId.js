const mongoose = require('mongoose');
const HttpError = require('../utils/HttpError');

// Rejects malformed ids with a clean 400 instead of a CastError/500.
module.exports = (param = 'id') => (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params[param])) {
    return next(new HttpError(400, `Invalid ${param}: "${req.params[param]}"`));
  }
  next();
};
