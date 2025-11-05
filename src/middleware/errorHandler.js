/**
 * Global Error Handler Middleware
 * Centralized error handling with logging and telemetry
 */

import logger from '../utils/logger.js';
import { sendError } from '../utils/responseHelper.js';
import { trackException } from '../telemetry.js';
import config from '../config.js';

/**
 * Global error handler
 */
export function errorHandler(err, req, res, next) {
  // Log error
  logger.error('Error occurred', {
    error: err.message,
    stack: config.env === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    correlationId: req.correlationId,
    user: req.user?.id
  });
  
  // Track exception in Application Insights
  trackException(err, {
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    correlationId: req.correlationId
  });
  
  // Determine status code
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    message = 'Forbidden';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    message = 'Resource not found';
  } else if (err.code === 'EREQUEST' || err.name === 'RequestError') {
    // Database errors
    statusCode = 500;
    message = 'Database error occurred';
  }
  
  // Don't leak error details in production
  const errorDetails = config.env === 'development' ? {
    type: err.name,
    stack: err.stack
  } : null;
  
  return sendError(res, message, statusCode, errorDetails);
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req, res) {
  logger.warn('Route not found', {
    path: req.path,
    method: req.method,
    correlationId: req.correlationId
  });
  
  return sendError(res, `Cannot ${req.method} ${req.path}`, 404);
}

/**
 * Async handler wrapper to catch errors in async route handlers
 * @param {Function} fn - Async function
 * @returns {Function} Wrapped function
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler
};
