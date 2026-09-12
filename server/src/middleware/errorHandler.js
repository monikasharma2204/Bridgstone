'use strict';

const ApiError = require('../utils/ApiError');
const env = require('../config/env');

/** 404 for any route that did not match. */
function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}


function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details = err.details;

  // Mongoose schema validation
  if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    message = 'Validation failed';
    details = Object.values(err.errors).map((e) => e.message);
  }

 
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for "${err.path}"`;
  }


  if (err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate entry';
    details = err.keyValue;
  }

  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Malformed JSON in request body';
    details = undefined;
  }

  if (statusCode >= 500) {
    console.error('[error]', err);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(details ? { details } : {}),
      ...(env.isProduction ? {} : { stack: err.stack }),
    },
  });
}

module.exports = { notFound, errorHandler };
