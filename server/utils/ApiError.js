// An Error that carries an HTTP status code. Controllers throw it, the error middleware turns it into JSON.
class ApiError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    if (errors) this.errors = errors;
  }
}

module.exports = ApiError;
