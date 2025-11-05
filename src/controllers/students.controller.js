/**
 * Students Controller
 * Business logic for student operations
 */

import * as studentsModel from '../models/students.model.js';
import { generateToken } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';
import { trackLogin } from '../telemetry.js';
import logger from '../utils/logger.js';

/**
 * Register new student
 */
export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    
    // Create student
    const student = await studentsModel.createStudent({ name, email, password });
    
    // Generate JWT token
    const token = generateToken({
      id: student.StudentID,
      email: student.Email,
      role: 'student',
      studentID: student.StudentID
    });
    
    // Remove sensitive data
    delete student.PasswordHash;
    
    logger.info('Student registered successfully', { 
      studentId: student.StudentID,
      email: student.Email
    });
    
    return sendSuccess(res, {
      user: student,
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
 * Student login
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    
    // Find student
    const student = await studentsModel.findStudentByEmail(email);
    
    if (!student) {
      trackLogin(null, 'student', false);
      return sendError(res, 'Invalid credentials', 401);
    }
    
    // Verify password
    const isValidPassword = await studentsModel.verifyPassword(password, student.PasswordHash);
    
    if (!isValidPassword) {
      trackLogin(student.StudentID, 'student', false);
      return sendError(res, 'Invalid credentials', 401);
    }
    
    // Generate JWT token
    const token = generateToken({
      id: student.StudentID,
      email: student.Email,
      role: 'student',
      studentID: student.StudentID
    });
    
    // Remove sensitive data
    delete student.PasswordHash;
    
    trackLogin(student.StudentID, 'student', true);
    
    logger.info('Student logged in successfully', { 
      studentId: student.StudentID,
      email: student.Email
    });
    
    return sendSuccess(res, {
      user: student,
      token
    }, 'Login successful');
  } catch (error) {
    next(error);
  }
}

/**
 * Get all students (admin only)
 */
export async function getAllStudents(req, res, next) {
  try {
    const { limit, offset } = req.query;
    
    const students = await studentsModel.getAllStudents({
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    });
    
    return sendSuccess(res, { students }, 'Students retrieved successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Get student profile
 */
export async function getProfile(req, res, next) {
  try {
    const studentId = req.user.studentID;
    
    const student = await studentsModel.findStudentById(studentId);
    
    if (!student) {
      return sendError(res, 'Student not found', 404);
    }
    
    return sendSuccess(res, { student }, 'Profile retrieved successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Update student profile
 */
export async function updateProfile(req, res, next) {
  try {
    const studentId = req.user.studentID;
    const { name } = req.body;
    
    const student = await studentsModel.updateStudent(studentId, { name });
    
    return sendSuccess(res, { student }, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
}

export default {
  register,
  login,
  getAllStudents,
  getProfile,
  updateProfile
};
