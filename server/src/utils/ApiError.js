'use strict';

class ApiError extends Error {
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace?.(this, ApiError);
  }

  static badRequest(message = 'Bad request', details) {
    return new ApiError(400, message, details);
  }

  static notFound(message = 'Resource not found', details) {
    return new ApiError(404, message, details);
  }

  static conflict(message = 'Conflict', details) {
    return new ApiError(409, message, details);
  }

  static internal(message = 'Internal server error', details) {
    return new ApiError(500, message, details);
  }
}

module.exports = ApiError;
