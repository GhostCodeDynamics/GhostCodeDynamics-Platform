export class ApiError extends Error {
  constructor(statusCode, message, errors = undefined) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    if (errors !== undefined) {
      this.errors = errors;
    }
  }
}
