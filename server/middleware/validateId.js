const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');

// Used with router.param('id', validateId): rejects malformed ids with a clean 400 instead of a Mongoose CastError.
module.exports = (req, res, next, value) => {
  if (!mongoose.isValidObjectId(value) || String(value).length !== 24) {
    return next(new ApiError(400, `Invalid id: "${value}"`));
  }
  next();
};
