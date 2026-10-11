// Error with an HTTP status code, caught by the error-handling middleware.
class HttpError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}
module.exports = HttpError;
