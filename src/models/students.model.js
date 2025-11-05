/**
 * Students Model
 * Data access layer for student operations
 */

import bcrypt from 'bcryptjs';
import { executeQuery, executeProcedure, sql } from './db.js';
import logger from '../utils/logger.js';
import config from '../config.js';

/**
 * Create a new student
 * @param {object} studentData - Student data
 * @returns {Promise<object>} Created student
 */
export async function createStudent({ name, email, password }) {
  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, config.bcrypt.saltRounds);
    
    // Check if email already exists
    const existing = await executeQuery(
      'SELECT StudentID FROM Students WHERE Email = @email',
      { email }
    );
    
    if (existing.recordset.length > 0) {
      throw new Error('Email already registered');
    }
    
    // Insert student
    const result = await executeQuery(
      `INSERT INTO Students (Name, Email, PasswordHash, CreatedAt)
       OUTPUT INSERTED.StudentID, INSERTED.Name, INSERTED.Email, INSERTED.CreatedAt
       VALUES (@name, @email, @passwordHash, GETUTCDATE())`,
      {
        name,
        email,
        passwordHash: hashedPassword
      }
    );
    
    logger.info('Student created', { studentId: result.recordset[0].StudentID, email });
    
    return result.recordset[0];
  } catch (error) {
    logger.error('Failed to create student', { error: error.message, email });
    throw error;
  }
}

/**
 * Find student by email
 * @param {string} email - Student email
 * @returns {Promise<object|null>} Student or null
 */
export async function findStudentByEmail(email) {
  try {
    const result = await executeQuery(
      'SELECT StudentID, Name, Email, PasswordHash, CreatedAt FROM Students WHERE Email = @email',
      { email }
    );
    
    return result.recordset[0] || null;
  } catch (error) {
    logger.error('Failed to find student by email', { error: error.message, email });
    throw error;
  }
}

/**
 * Find student by ID
 * @param {number} studentId - Student ID
 * @returns {Promise<object|null>} Student or null
 */
export async function findStudentById(studentId) {
  try {
    const result = await executeQuery(
      'SELECT StudentID, Name, Email, CreatedAt FROM Students WHERE StudentID = @studentId',
      { studentId: [sql.Int, studentId] }
    );
    
    return result.recordset[0] || null;
  } catch (error) {
    logger.error('Failed to find student by ID', { error: error.message, studentId });
    throw error;
  }
}

/**
 * Get all students (admin only)
 * @param {object} options - Query options
 * @returns {Promise<Array>} List of students
 */
export async function getAllStudents(options = {}) {
  try {
    const { limit = 100, offset = 0 } = options;
    
    const result = await executeQuery(
      `SELECT StudentID, Name, Email, CreatedAt 
       FROM Students 
       ORDER BY CreatedAt DESC
       OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
      {
        offset: [sql.Int, offset],
        limit: [sql.Int, limit]
      }
    );
    
    logger.debug('Retrieved students', { count: result.recordset.length });
    
    return result.recordset;
  } catch (error) {
    logger.error('Failed to get all students', { error: error.message });
    throw error;
  }
}

/**
 * Verify student password
 * @param {string} plainPassword - Plain text password
 * @param {string} hashedPassword - Hashed password from database
 * @returns {Promise<boolean>} Password valid
 */
export async function verifyPassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Update student profile
 * @param {number} studentId - Student ID
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} Updated student
 */
export async function updateStudent(studentId, updates) {
  try {
    const { name } = updates;
    
    const result = await executeQuery(
      `UPDATE Students 
       SET Name = @name
       OUTPUT INSERTED.StudentID, INSERTED.Name, INSERTED.Email, INSERTED.CreatedAt
       WHERE StudentID = @studentId`,
      {
        studentId: [sql.Int, studentId],
        name
      }
    );
    
    if (result.recordset.length === 0) {
      throw new Error('Student not found');
    }
    
    logger.info('Student updated', { studentId });
    
    return result.recordset[0];
  } catch (error) {
    logger.error('Failed to update student', { error: error.message, studentId });
    throw error;
  }
}

export default {
  createStudent,
  findStudentByEmail,
  findStudentById,
  getAllStudents,
  verifyPassword,
  updateStudent
};
