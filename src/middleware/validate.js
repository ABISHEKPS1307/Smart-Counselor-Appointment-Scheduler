/**
 * Input Validation Middleware
 * Request validation and sanitization
 */

import { sendValidationError } from '../utils/responseHelper.js';

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean}
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * @param {string} password - Password
 * @returns {object} Validation result
 */
export function validatePassword(password) {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  // Optional: Add more password requirements
  // if (!/[A-Z]/.test(password)) {
  //   errors.push('Password must contain at least one uppercase letter');
  // }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize string input (prevent XSS)
 * @param {string} input - Input string
 * @returns {string} Sanitized string
 */
export function sanitizeString(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and >
    .substring(0, 1000); // Limit length
}

/**
 * Validate student registration input
 */
export function validateStudentRegistration(req, res, next) {
  const { name, email, password } = req.body;
  const errors = [];
  
  // Validate name
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Name must be at least 2 characters' });
  }
  
  // Validate email
  if (!email || !isValidEmail(email)) {
    errors.push({ field: 'email', message: 'Valid email is required' });
  }
  
  // Validate password
  if (!password) {
    errors.push({ field: 'password', message: 'Password is required' });
  } else {
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      errors.push(...passwordValidation.errors.map(msg => ({
        field: 'password',
        message: msg
      })));
    }
  }
  
  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }
  
  // Sanitize inputs
  req.body.name = sanitizeString(name);
  req.body.email = email.trim().toLowerCase();
  
  next();
}

/**
 * Validate counselor registration input
 */
export function validateCounselorRegistration(req, res, next) {
  const { name, email, password, counselorType, bio } = req.body;
  const errors = [];
  
  // Validate name
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Name must be at least 2 characters' });
  }
  
  // Validate email
  if (!email || !isValidEmail(email)) {
    errors.push({ field: 'email', message: 'Valid email is required' });
  }
  
  // Validate password
  if (!password) {
    errors.push({ field: 'password', message: 'Password is required' });
  } else {
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      errors.push(...passwordValidation.errors.map(msg => ({
        field: 'password',
        message: msg
      })));
    }
  }
  
  // Validate counselor type
  const validTypes = ['Academic', 'Career', 'Personal', 'Mental Health'];
  if (!counselorType || !validTypes.includes(counselorType)) {
    errors.push({ field: 'counselorType', message: 'Valid counselor type is required' });
  }
  
  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }
  
  // Sanitize inputs
  req.body.name = sanitizeString(name);
  req.body.email = email.trim().toLowerCase();
  req.body.bio = bio ? sanitizeString(bio) : '';
  
  next();
}

/**
 * Validate login input
 */
export function validateLogin(req, res, next) {
  const { email, password } = req.body;
  const errors = [];
  
  if (!email || !isValidEmail(email)) {
    errors.push({ field: 'email', message: 'Valid email is required' });
  }
  
  if (!password || typeof password !== 'string') {
    errors.push({ field: 'password', message: 'Password is required' });
  }
  
  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }
  
  req.body.email = email.trim().toLowerCase();
  
  next();
}

/**
 * Validate appointment creation input
 */
export function validateAppointment(req, res, next) {
  const { studentID, counselorID, date, time } = req.body;
  const errors = [];
  
  // Validate IDs
  if (!studentID || !Number.isInteger(studentID) || studentID <= 0) {
    errors.push({ field: 'studentID', message: 'Valid student ID is required' });
  }
  
  if (!counselorID || !Number.isInteger(counselorID) || counselorID <= 0) {
    errors.push({ field: 'counselorID', message: 'Valid counselor ID is required' });
  }
  
  // Validate date (YYYY-MM-DD format)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!date || !dateRegex.test(date)) {
    errors.push({ field: 'date', message: 'Valid date is required (YYYY-MM-DD)' });
  } else {
    const appointmentDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (appointmentDate < today) {
      errors.push({ field: 'date', message: 'Cannot book appointments in the past' });
    }
  }
  
  // Validate time (HH:MM or HH:MM:SS format)
  // HTML5 time input returns HH:MM, but we also accept HH:MM:SS
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
  if (!time || !timeRegex.test(time)) {
    errors.push({ field: 'time', message: 'Valid time is required (HH:MM or HH:MM:SS)' });
  } else {
    // Normalize time to HH:MM:SS format for database consistency
    if (time.length === 5) {
      req.body.time = time + ':00';
    }
  }
  
  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }
  
  next();
}

/**
 * Validate AI query input
 */
export function validateAIQuery(req, res, next) {
  const { prompt, mode } = req.body;
  const errors = [];
  
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
    errors.push({ field: 'prompt', message: 'Prompt must be at least 3 characters' });
  }
  
  const validModes = ['chat', 'summarizeFeedback', 'recommendation'];
  if (!mode || !validModes.includes(mode)) {
    errors.push({ field: 'mode', message: 'Invalid mode. Must be: chat, summarizeFeedback, or recommendation' });
  }
  
  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }
  
  req.body.prompt = sanitizeString(prompt);
  
  next();
}

export default {
  isValidEmail,
  validatePassword,
  sanitizeString,
  validateStudentRegistration,
  validateCounselorRegistration,
  validateLogin,
  validateAppointment,
  validateAIQuery
};
