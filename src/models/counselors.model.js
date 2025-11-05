/**
 * Counselors Model
 * Data access layer for counselor operations
 */

import bcrypt from 'bcryptjs';
import { executeQuery, executeProcedure, sql } from './db.js';
import logger from '../utils/logger.js';
import config from '../config.js';

/**
 * Create a new counselor
 * @param {object} counselorData - Counselor data
 * @returns {Promise<object>} Created counselor
 */
export async function createCounselor({ name, email, password, counselorType, bio, photo }) {
  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, config.bcrypt.saltRounds);
    
    // Check if email already exists
    const existing = await executeQuery(
      'SELECT CounselorID FROM Counselors WHERE Email = @email',
      { email }
    );
    
    if (existing.recordset.length > 0) {
      throw new Error('Email already registered');
    }
    
    // Insert counselor
    const result = await executeQuery(
      `INSERT INTO Counselors (Name, Email, PasswordHash, CounselorType, Bio, Photo, CreatedAt)
       OUTPUT INSERTED.CounselorID, INSERTED.Name, INSERTED.Email, INSERTED.CounselorType, 
              INSERTED.Bio, INSERTED.Photo, INSERTED.CreatedAt
       VALUES (@name, @email, @passwordHash, @counselorType, @bio, @photo, GETUTCDATE())`,
      {
        name,
        email,
        passwordHash: hashedPassword,
        counselorType,
        bio: bio || '',
        photo: photo || null
      }
    );
    
    logger.info('Counselor created', { 
      counselorId: result.recordset[0].CounselorID, 
      email, 
      type: counselorType 
    });
    
    return result.recordset[0];
  } catch (error) {
    logger.error('Failed to create counselor', { error: error.message, email });
    throw error;
  }
}

/**
 * Find counselor by email
 * @param {string} email - Counselor email
 * @returns {Promise<object|null>} Counselor or null
 */
export async function findCounselorByEmail(email) {
  try {
    const result = await executeQuery(
      `SELECT CounselorID, Name, Email, PasswordHash, CounselorType, Bio, Photo, CreatedAt 
       FROM Counselors WHERE Email = @email`,
      { email }
    );
    
    return result.recordset[0] || null;
  } catch (error) {
    logger.error('Failed to find counselor by email', { error: error.message, email });
    throw error;
  }
}

/**
 * Find counselor by ID
 * @param {number} counselorId - Counselor ID
 * @returns {Promise<object|null>} Counselor or null
 */
export async function findCounselorById(counselorId) {
  try {
    const result = await executeQuery(
      `SELECT CounselorID, Name, Email, CounselorType, Bio, Photo, CreatedAt 
       FROM Counselors WHERE CounselorID = @counselorId`,
      { counselorId: [sql.Int, counselorId] }
    );
    
    return result.recordset[0] || null;
  } catch (error) {
    logger.error('Failed to find counselor by ID', { error: error.message, counselorId });
    throw error;
  }
}

/**
 * Get all counselors (public)
 * @param {object} filters - Filter options
 * @returns {Promise<Array>} List of counselors
 */
export async function getAllCounselors(filters = {}) {
  try {
    const { counselorType, limit = 100, offset = 0 } = filters;
    
    let query = `
      SELECT CounselorID, Name, Email, CounselorType, Bio, Photo, CreatedAt 
      FROM Counselors
    `;
    
    const params = {};
    
    if (counselorType) {
      query += ' WHERE CounselorType = @counselorType';
      params.counselorType = counselorType;
    }
    
    query += ' ORDER BY Name OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY';
    params.offset = [sql.Int, offset];
    params.limit = [sql.Int, limit];
    
    const result = await executeQuery(query, params);
    
    logger.debug('Retrieved counselors', { 
      count: result.recordset.length, 
      type: counselorType 
    });
    
    return result.recordset;
  } catch (error) {
    logger.error('Failed to get all counselors', { error: error.message });
    throw error;
  }
}

/**
 * Verify counselor password
 * @param {string} plainPassword - Plain text password
 * @param {string} hashedPassword - Hashed password from database
 * @returns {Promise<boolean>} Password valid
 */
export async function verifyPassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Update counselor profile
 * @param {number} counselorId - Counselor ID
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} Updated counselor
 */
export async function updateCounselor(counselorId, updates) {
  try {
    const { name, bio, photo } = updates;
    
    const result = await executeQuery(
      `UPDATE Counselors 
       SET Name = COALESCE(@name, Name),
           Bio = COALESCE(@bio, Bio),
           Photo = COALESCE(@photo, Photo)
       OUTPUT INSERTED.CounselorID, INSERTED.Name, INSERTED.Email, INSERTED.CounselorType,
              INSERTED.Bio, INSERTED.Photo, INSERTED.CreatedAt
       WHERE CounselorID = @counselorId`,
      {
        counselorId: [sql.Int, counselorId],
        name: name || null,
        bio: bio || null,
        photo: photo || null
      }
    );
    
    if (result.recordset.length === 0) {
      throw new Error('Counselor not found');
    }
    
    logger.info('Counselor updated', { counselorId });
    
    return result.recordset[0];
  } catch (error) {
    logger.error('Failed to update counselor', { error: error.message, counselorId });
    throw error;
  }
}

export default {
  createCounselor,
  findCounselorByEmail,
  findCounselorById,
  getAllCounselors,
  verifyPassword,
  updateCounselor
};
