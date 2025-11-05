/**
 * Appointments Model
 * Data access layer for appointment operations
 */

import { executeQuery, executeProcedure, sql } from './db.js';
import logger from '../utils/logger.js';

/**
 * Create a new appointment
 * @param {object} appointmentData - Appointment data
 * @returns {Promise<object>} Created appointment
 */
export async function createAppointment({ studentID, counselorID, date, time }) {
  try {
    // Check for existing appointment at same time
    const conflict = await executeQuery(
      `SELECT AppointmentID FROM Appointments 
       WHERE CounselorID = @counselorID 
       AND Date = @date 
       AND Time = @time 
       AND Status IN ('Pending', 'Accepted')`,
      {
        counselorID: [sql.Int, counselorID],
        date,
        time
      }
    );
    
    if (conflict.recordset.length > 0) {
      throw new Error('This time slot is already booked');
    }
    
    // Insert appointment
    const result = await executeQuery(
      `INSERT INTO Appointments (StudentID, CounselorID, Date, Time, Status, CreatedAt)
       OUTPUT INSERTED.AppointmentID, INSERTED.StudentID, INSERTED.CounselorID,
              INSERTED.Date, INSERTED.Time, INSERTED.Status, INSERTED.CreatedAt
       VALUES (@studentID, @counselorID, @date, @time, 'Pending', GETUTCDATE())`,
      {
        studentID: [sql.Int, studentID],
        counselorID: [sql.Int, counselorID],
        date,
        time
      }
    );
    
    logger.info('Appointment created', { 
      appointmentId: result.recordset[0].AppointmentID,
      studentID,
      counselorID,
      date,
      time
    });
    
    return result.recordset[0];
  } catch (error) {
    logger.error('Failed to create appointment', { 
      error: error.message,
      studentID,
      counselorID,
      date,
      time
    });
    throw error;
  }
}

/**
 * Get appointments by student ID
 * @param {number} studentId - Student ID
 * @returns {Promise<Array>} List of appointments
 */
export async function getAppointmentsByStudent(studentId) {
  try {
    const result = await executeQuery(
      `SELECT 
        a.AppointmentID,
        a.StudentID,
        a.CounselorID,
        a.Date,
        a.Time,
        a.Status,
        a.CreatedAt,
        c.Name AS CounselorName,
        c.Email AS CounselorEmail,
        c.CounselorType,
        c.Photo AS CounselorPhoto
       FROM Appointments a
       INNER JOIN Counselors c ON a.CounselorID = c.CounselorID
       WHERE a.StudentID = @studentId
       ORDER BY a.Date DESC, a.Time DESC`,
      { studentId: [sql.Int, studentId] }
    );
    
    logger.debug('Retrieved student appointments', { 
      studentId, 
      count: result.recordset.length 
    });
    
    return result.recordset;
  } catch (error) {
    logger.error('Failed to get student appointments', { 
      error: error.message,
      studentId
    });
    throw error;
  }
}

/**
 * Get appointments by counselor ID
 * @param {number} counselorId - Counselor ID
 * @returns {Promise<Array>} List of appointments
 */
export async function getAppointmentsByCounselor(counselorId) {
  try {
    const result = await executeQuery(
      `SELECT 
        a.AppointmentID,
        a.StudentID,
        a.CounselorID,
        a.Date,
        a.Time,
        a.Status,
        a.CreatedAt,
        s.Name AS StudentName,
        s.Email AS StudentEmail
       FROM Appointments a
       INNER JOIN Students s ON a.StudentID = s.StudentID
       WHERE a.CounselorID = @counselorId
       ORDER BY a.Date DESC, a.Time DESC`,
      { counselorId: [sql.Int, counselorId] }
    );
    
    logger.debug('Retrieved counselor appointments', { 
      counselorId, 
      count: result.recordset.length 
    });
    
    return result.recordset;
  } catch (error) {
    logger.error('Failed to get counselor appointments', { 
      error: error.message,
      counselorId
    });
    throw error;
  }
}

/**
 * Get appointment by ID
 * @param {number} appointmentId - Appointment ID
 * @returns {Promise<object|null>} Appointment or null
 */
export async function getAppointmentById(appointmentId) {
  try {
    const result = await executeQuery(
      `SELECT 
        a.AppointmentID,
        a.StudentID,
        a.CounselorID,
        a.Date,
        a.Time,
        a.Status,
        a.CreatedAt,
        s.Name AS StudentName,
        s.Email AS StudentEmail,
        c.Name AS CounselorName,
        c.Email AS CounselorEmail,
        c.CounselorType
       FROM Appointments a
       INNER JOIN Students s ON a.StudentID = s.StudentID
       INNER JOIN Counselors c ON a.CounselorID = c.CounselorID
       WHERE a.AppointmentID = @appointmentId`,
      { appointmentId: [sql.Int, appointmentId] }
    );
    
    return result.recordset[0] || null;
  } catch (error) {
    logger.error('Failed to get appointment by ID', { 
      error: error.message,
      appointmentId
    });
    throw error;
  }
}

/**
 * Update appointment status
 * @param {number} appointmentId - Appointment ID
 * @param {string} status - New status
 * @returns {Promise<object>} Updated appointment
 */
export async function updateAppointmentStatus(appointmentId, status) {
  try {
    // Validate status
    const validStatuses = ['Pending', 'Accepted', 'Rejected', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status');
    }
    
    const result = await executeQuery(
      `UPDATE Appointments 
       SET Status = @status, UpdatedAt = GETUTCDATE()
       OUTPUT INSERTED.AppointmentID, INSERTED.StudentID, INSERTED.CounselorID,
              INSERTED.Date, INSERTED.Time, INSERTED.Status, INSERTED.CreatedAt, INSERTED.UpdatedAt
       WHERE AppointmentID = @appointmentId`,
      {
        appointmentId: [sql.Int, appointmentId],
        status
      }
    );
    
    if (result.recordset.length === 0) {
      throw new Error('Appointment not found');
    }
    
    logger.info('Appointment status updated', { appointmentId, status });
    
    return result.recordset[0];
  } catch (error) {
    logger.error('Failed to update appointment status', { 
      error: error.message,
      appointmentId,
      status
    });
    throw error;
  }
}

/**
 * Delete appointment
 * @param {number} appointmentId - Appointment ID
 * @returns {Promise<boolean>} Success
 */
export async function deleteAppointment(appointmentId) {
  try {
    const result = await executeQuery(
      'DELETE FROM Appointments WHERE AppointmentID = @appointmentId',
      { appointmentId: [sql.Int, appointmentId] }
    );
    
    logger.info('Appointment deleted', { appointmentId });
    
    return result.rowsAffected[0] > 0;
  } catch (error) {
    logger.error('Failed to delete appointment', { 
      error: error.message,
      appointmentId
    });
    throw error;
  }
}

/**
 * Log AI interaction
 * @param {object} logData - AI log data
 * @returns {Promise<void>}
 */
export async function logAIInteraction({ userId, userType, prompt, response, mode, duration, cached }) {
  try {
    await executeQuery(
      `INSERT INTO AI_Logs (UserID, UserType, Prompt, Response, Mode, Duration, Cached, CreatedAt)
       VALUES (@userId, @userType, @prompt, @response, @mode, @duration, @cached, GETUTCDATE())`,
      {
        userId: [sql.Int, userId],
        userType,
        prompt,
        response,
        mode,
        duration: [sql.Int, duration],
        cached: [sql.Bit, cached]
      }
    );
    
    logger.debug('AI interaction logged', { userId, mode });
  } catch (error) {
    logger.error('Failed to log AI interaction', { error: error.message });
    // Don't throw - logging failure shouldn't break the request
  }
}

export default {
  createAppointment,
  getAppointmentsByStudent,
  getAppointmentsByCounselor,
  getAppointmentById,
  updateAppointmentStatus,
  deleteAppointment,
  logAIInteraction
};
