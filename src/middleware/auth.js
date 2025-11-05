/**
 * Authentication Middleware
 * JWT token verification and role-based access control
 */

import jwt from 'jsonwebtoken';
import config from '../config.js';
import logger from '../utils/logger.js';
import { sendUnauthorized, sendForbidden } from '../utils/responseHelper.js';

/**
 * Verify JWT token and attach user to request
 */
export function authenticate(req, res, next) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendUnauthorized(res, 'No token provided');
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Attach user to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      studentID: decoded.studentID,
      counselorID: decoded.counselorID
    };
    
    logger.debug('User authenticated', {
      userId: req.user.id,
      role: req.user.role,
      correlationId: req.correlationId
    });
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendUnauthorized(res, 'Token expired');
    } else if (error.name === 'JsonWebTokenError') {
      return sendUnauthorized(res, 'Invalid token');
    } else {
      logger.error('Authentication error', { error: error.message });
      return sendUnauthorized(res, 'Authentication failed');
    }
  }
}

/**
 * Require specific role(s)
 * @param {...string} allowedRoles - Allowed roles
 * @returns {Function} Middleware function
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return sendUnauthorized(res, 'Not authenticated');
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Authorization failed', {
        userId: req.user.id,
        userRole: req.user.role,
        required: allowedRoles,
        correlationId: req.correlationId
      });
      return sendForbidden(res, 'Insufficient permissions');
    }
    
    next();
  };
}

/**
 * Optional authentication - attach user if token provided
 * Does not fail if no token
 */
export function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, config.jwt.secret);
      
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        studentID: decoded.studentID,
        counselorID: decoded.counselorID
      };
    }
  } catch (error) {
    // Silently fail for optional auth
    logger.debug('Optional auth failed', { error: error.message });
  }
  
  next();
}

/**
 * Generate JWT token
 * @param {object} payload - Token payload
 * @param {string} expiresIn - Expiration time
 * @returns {string} JWT token
 */
export function generateToken(payload, expiresIn = config.jwt.expiresIn) {
  return jwt.sign(payload, config.jwt.secret, { expiresIn });
}

/**
 * Generate refresh token
 * @param {object} payload - Token payload
 * @returns {string} Refresh token
 */
export function generateRefreshToken(payload) {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiresIn
  });
}

export default {
  authenticate,
  requireRole,
  optionalAuth,
  generateToken,
  generateRefreshToken
};
