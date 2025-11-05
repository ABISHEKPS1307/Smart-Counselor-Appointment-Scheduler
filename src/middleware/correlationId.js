/**
 * Correlation ID Middleware
 * Adds unique correlation ID to each request for distributed tracing
 */

import { randomUUID } from 'crypto';

/**
 * Add correlation ID to request
 */
export function correlationId(req, res, next) {
  // Use existing correlation ID from header or generate new one
  req.correlationId = req.headers['x-correlation-id'] || randomUUID();
  
  // Add correlation ID to response headers
  res.setHeader('X-Correlation-ID', req.correlationId);
  
  next();
}

export default correlationId;
