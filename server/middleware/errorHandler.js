/**
 * Error Handling Middleware
 * Provides centralized error handling and user-friendly error messages
 */

/**
 * Custom error class for validation errors
 */
class ValidationError extends Error {
  constructor(message, errors = {}) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
    this.errors = errors;
  }
}

/**
 * Custom error class for not found errors
 */
class NotFoundError extends Error {
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
    this.status = 404;
  }
}

/**
 * Custom error class for database errors
 */
class DatabaseError extends Error {
  constructor(message = 'Database operation failed', originalError = null) {
    super(message);
    this.name = 'DatabaseError';
    this.status = 500;
    this.originalError = originalError;
  }
}

/**
 * Error handler middleware
 * Catches all errors and formats them for the client
 */
function errorHandler(err, req, res, next) {
  // Log error for debugging
  console.error('Error occurred:', {
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  // Default error response
  let status = err.status || 500;
  let response = {
    success: false,
    error: {
      message: err.message || 'Internal server error',
      type: err.name || 'Error'
    }
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    response.error.errors = err.errors;
  }

  // Handle database errors
  if (err.code) {
    // PostgreSQL error codes
    switch (err.code) {
      case '23505': // Unique violation
        status = 409;
        response.error.message = 'A record with this value already exists';
        break;
      case '23503': // Foreign key violation
        status = 400;
        response.error.message = 'Referenced record does not exist';
        break;
      case '23502': // Not null violation
        status = 400;
        response.error.message = 'Required field is missing';
        break;
      case '22P02': // Invalid text representation
        status = 400;
        response.error.message = 'Invalid data format';
        break;
      case '42P01': // Undefined table
        status = 500;
        response.error.message = 'Database configuration error';
        break;
      default:
        status = 500;
        response.error.message = 'Database operation failed';
    }
  }

  // Handle JSON parsing errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    status = 400;
    response.error.message = 'Invalid JSON in request body';
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && status === 500) {
    response.error.message = 'An unexpected error occurred. Please try again later.';
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.error.stack = err.stack;
  }

  res.status(status).json(response);
}

/**
 * 404 handler for undefined routes
 */
function notFoundHandler(req, res, next) {
  const error = new NotFoundError(`Route ${req.method} ${req.path} not found`);
  next(error);
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Validation error helper
 * Creates a ValidationError from validation results
 */
function createValidationError(errors) {
  const errorMessages = Object.values(errors).join(', ');
  return new ValidationError(`Validation failed: ${errorMessages}`, errors);
}

module.exports = {
  ValidationError,
  NotFoundError,
  DatabaseError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  createValidationError
};
