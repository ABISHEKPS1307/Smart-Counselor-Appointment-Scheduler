/**
 * Response Helper Utilities
 * Standardized API response formatting
 */

/**
 * Send success response
 * @param {object} res - Express response object
 * @param {object} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 */
export function sendSuccess(res, data = null, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  });
}

/**
 * Send error response
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {object} details - Additional error details
 */
export function sendError(res, message = 'An error occurred', statusCode = 500, details = null) {
  const response = {
    success: false,
    error: {
      message,
      code: statusCode
    },
    timestamp: new Date().toISOString()
  };
  
  if (details) {
    response.error.details = details;
  }
  
  return res.status(statusCode).json(response);
}

/**
 * Send validation error
 * @param {object} res - Express response object
 * @param {array} errors - Validation errors
 */
export function sendValidationError(res, errors) {
  return res.status(400).json({
    success: false,
    error: {
      message: 'Validation failed',
      code: 400,
      details: errors
    },
    timestamp: new Date().toISOString()
  });
}

/**
 * Send unauthorized response
 * @param {object} res - Express response object
 * @param {string} message - Error message
 */
export function sendUnauthorized(res, message = 'Unauthorized') {
  return sendError(res, message, 401);
}

/**
 * Send forbidden response
 * @param {object} res - Express response object
 * @param {string} message - Error message
 */
export function sendForbidden(res, message = 'Forbidden') {
  return sendError(res, message, 403);
}

/**
 * Send not found response
 * @param {object} res - Express response object
 * @param {string} message - Error message
 */
export function sendNotFound(res, message = 'Resource not found') {
  return sendError(res, message, 404);
}

export default {
  sendSuccess,
  sendError,
  sendValidationError,
  sendUnauthorized,
  sendForbidden,
  sendNotFound
};
