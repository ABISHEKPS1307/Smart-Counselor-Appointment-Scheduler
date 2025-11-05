/**
 * Counselors Controller
 * Business logic for counselor operations
 */

import * as counselorsModel from '../models/counselors.model.js';
import { generateToken } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';
import { trackLogin } from '../telemetry.js';
import logger from '../utils/logger.js';

/**
 * Register new counselor
 */
export async function register(req, res, next) {
  try {
    const { name, email, password, counselorType, bio, photo } = req.body;
    
    // Create counselor
    const counselor = await counselorsModel.createCounselor({
      name,
      email,
      password,
      counselorType,
      bio,
      photo
    });
    
    // Generate JWT token
    const token = generateToken({
      id: counselor.CounselorID,
      email: counselor.Email,
      role: 'counselor',
      counselorID: counselor.CounselorID
    });
    
    // Remove sensitive data
    delete counselor.PasswordHash;
    
    logger.info('Counselor registered successfully', { 
      counselorId: counselor.CounselorID,
      email: counselor.Email,
      type: counselor.CounselorType
    });
    
    return sendSuccess(res, {
      user: counselor,
      token
    }, 'Registration successful', 201);
  } catch (error) {
    if (error.message === 'Email already registered') {
      return sendError(res, 'Email already registered', 409);
    }
    next(error);
  }
}

/**
 * Counselor login
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    
    // Find counselor
    const counselor = await counselorsModel.findCounselorByEmail(email);
    
    if (!counselor) {
      trackLogin(null, 'counselor', false);
      return sendError(res, 'Invalid credentials', 401);
    }
    
    // Verify password
    const isValidPassword = await counselorsModel.verifyPassword(password, counselor.PasswordHash);
    
    if (!isValidPassword) {
      trackLogin(counselor.CounselorID, 'counselor', false);
      return sendError(res, 'Invalid credentials', 401);
    }
    
    // Generate JWT token
    const token = generateToken({
      id: counselor.CounselorID,
      email: counselor.Email,
      role: 'counselor',
      counselorID: counselor.CounselorID
    });
    
    // Remove sensitive data
    delete counselor.PasswordHash;
    
    trackLogin(counselor.CounselorID, 'counselor', true);
    
    logger.info('Counselor logged in successfully', { 
      counselorId: counselor.CounselorID,
      email: counselor.Email
    });
    
    return sendSuccess(res, {
      user: counselor,
      token
    }, 'Login successful');
  } catch (error) {
    next(error);
  }
}

/**
 * Get all counselors (public)
 */
export async function getAllCounselors(req, res, next) {
  try {
    const { counselorType, limit, offset } = req.query;
    
    const counselors = await counselorsModel.getAllCounselors({
      counselorType,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    });
    
    return sendSuccess(res, { counselors }, 'Counselors retrieved successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Get counselor profile
 */
export async function getProfile(req, res, next) {
  try {
    const counselorId = req.user.counselorID;
    
    const counselor = await counselorsModel.findCounselorById(counselorId);
    
    if (!counselor) {
      return sendError(res, 'Counselor not found', 404);
    }
    
    return sendSuccess(res, { counselor }, 'Profile retrieved successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Update counselor profile
 */
export async function updateProfile(req, res, next) {
  try {
    const counselorId = req.user.counselorID;
    const { name, bio, photo } = req.body;
    
    const counselor = await counselorsModel.updateCounselor(counselorId, {
      name,
      bio,
      photo
    });
    
    return sendSuccess(res, { counselor }, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
}

export default {
  register,
  login,
  getAllCounselors,
  getProfile,
  updateProfile
};
