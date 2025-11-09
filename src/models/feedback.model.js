/**
 * Feedback Model
 * Data access layer for feedback operations
 */

import { executeQuery, sql } from './db.js';
import logger from '../utils/logger.js';

/**
 * Create feedback with AI analysis
 * @param {object} feedbackData - Feedback data
 * @returns {Promise<object>} Created feedback
 */
export async function createFeedback({
  appointmentID,
  studentID,
  counselorID,
  feedbackText,
  rating,
  sentiment,
  summary,
  improvementSuggestions
}) {
  try {
    // Check if feedback already exists for this appointment
    const existing = await executeQuery(
      'SELECT FeedbackID FROM Feedback WHERE AppointmentID = @appointmentID',
      { appointmentID: [sql.Int, appointmentID] }
    );

    if (existing.recordset.length > 0) {
      throw new Error('Feedback already submitted for this appointment');
    }

    // Insert feedback
    const result = await executeQuery(
      `INSERT INTO Feedback (
        AppointmentID, StudentID, CounselorID, FeedbackText,
        Rating, Sentiment, Summary, ImprovementSuggestions, CreatedAt
      )
      OUTPUT INSERTED.FeedbackID, INSERTED.AppointmentID, INSERTED.StudentID,
             INSERTED.CounselorID, INSERTED.FeedbackText, INSERTED.Rating,
             INSERTED.Sentiment, INSERTED.Summary, INSERTED.ImprovementSuggestions,
             INSERTED.CreatedAt
      VALUES (
        @appointmentID, @studentID, @counselorID, @feedbackText,
        @rating, @sentiment, @summary, @improvementSuggestions, GETUTCDATE()
      )`,
      {
        appointmentID: [sql.Int, appointmentID],
        studentID: [sql.Int, studentID],
        counselorID: [sql.Int, counselorID],
        feedbackText: [sql.NVarChar, feedbackText],
        rating: [sql.Int, rating],
        sentiment: [sql.NVarChar(20), sentiment],
        summary: [sql.NVarChar(500), summary || null],
        improvementSuggestions: [sql.NVarChar(1000), improvementSuggestions || null]
      }
    );

    logger.info('Feedback created', {
      feedbackId: result.recordset[0].FeedbackID,
      appointmentID,
      studentID,
      counselorID,
      rating,
      sentiment
    });

    return result.recordset[0];
  } catch (error) {
    logger.error('Failed to create feedback', {
      error: error.message,
      appointmentID,
      studentID,
      counselorID
    });
    throw error;
  }
}

/**
 * Get feedback by counselor with average rating
 * @param {number} counselorId - Counselor ID
 * @returns {Promise<object>} Feedback list and statistics
 */
export async function getFeedbackByCounselor(counselorId) {
  try {
    // Get all feedback
    const feedbackResult = await executeQuery(
      `SELECT 
        f.FeedbackID,
        f.AppointmentID,
        f.StudentID,
        f.CounselorID,
        f.FeedbackText,
        f.Rating,
        f.Sentiment,
        f.Summary,
        f.ImprovementSuggestions,
        f.CreatedAt,
        s.Name AS StudentName,
        a.Date AS AppointmentDate
      FROM Feedback f
      INNER JOIN Students s ON f.StudentID = s.StudentID
      INNER JOIN Appointments a ON f.AppointmentID = a.AppointmentID
      WHERE f.CounselorID = @counselorId
      ORDER BY f.CreatedAt DESC`,
      { counselorId: [sql.Int, counselorId] }
    );

    // Get statistics
    const statsResult = await executeQuery(
      `SELECT 
        COUNT(*) AS TotalFeedback,
        AVG(CAST(Rating AS FLOAT)) AS AverageRating,
        SUM(CASE WHEN Sentiment = 'positive' THEN 1 ELSE 0 END) AS PositiveCount,
        SUM(CASE WHEN Sentiment = 'neutral' THEN 1 ELSE 0 END) AS NeutralCount,
        SUM(CASE WHEN Sentiment = 'negative' THEN 1 ELSE 0 END) AS NegativeCount
      FROM Feedback
      WHERE CounselorID = @counselorId`,
      { counselorId: [sql.Int, counselorId] }
    );

    const stats = statsResult.recordset[0] || {
      TotalFeedback: 0,
      AverageRating: 0,
      PositiveCount: 0,
      NeutralCount: 0,
      NegativeCount: 0
    };

    logger.debug('Retrieved counselor feedback', {
      counselorId,
      count: feedbackResult.recordset.length,
      avgRating: stats.AverageRating
    });

    return {
      feedback: feedbackResult.recordset,
      statistics: {
        totalFeedback: stats.TotalFeedback,
        averageRating: parseFloat(stats.AverageRating?.toFixed(2)) || 0,
        sentimentBreakdown: {
          positive: stats.PositiveCount,
          neutral: stats.NeutralCount,
          negative: stats.NegativeCount
        }
      }
    };
  } catch (error) {
    logger.error('Failed to get counselor feedback', {
      error: error.message,
      counselorId
    });
    throw error;
  }
}

/**
 * Get feedback by student
 * @param {number} studentId - Student ID
 * @returns {Promise<Array>} List of feedback
 */
export async function getFeedbackByStudent(studentId) {
  try {
    const result = await executeQuery(
      `SELECT 
        f.FeedbackID,
        f.AppointmentID,
        f.StudentID,
        f.CounselorID,
        f.FeedbackText,
        f.Rating,
        f.Sentiment,
        f.Summary,
        f.ImprovementSuggestions,
        f.CreatedAt,
        c.Name AS CounselorName,
        c.CounselorType,
        a.Date AS AppointmentDate
      FROM Feedback f
      INNER JOIN Counselors c ON f.CounselorID = c.CounselorID
      INNER JOIN Appointments a ON f.AppointmentID = a.AppointmentID
      WHERE f.StudentID = @studentId
      ORDER BY f.CreatedAt DESC`,
      { studentId: [sql.Int, studentId] }
    );

    logger.debug('Retrieved student feedback', {
      studentId,
      count: result.recordset.length
    });

    return result.recordset;
  } catch (error) {
    logger.error('Failed to get student feedback', {
      error: error.message,
      studentId
    });
    throw error;
  }
}

/**
 * Get feedback by appointment ID
 * @param {number} appointmentId - Appointment ID
 * @returns {Promise<object|null>} Feedback or null
 */
export async function getFeedbackByAppointment(appointmentId) {
  try {
    const result = await executeQuery(
      `SELECT 
        f.FeedbackID,
        f.AppointmentID,
        f.StudentID,
        f.CounselorID,
        f.FeedbackText,
        f.Rating,
        f.Sentiment,
        f.Summary,
        f.ImprovementSuggestions,
        f.CreatedAt
      FROM Feedback f
      WHERE f.AppointmentID = @appointmentId`,
      { appointmentId: [sql.Int, appointmentId] }
    );

    return result.recordset[0] || null;
  } catch (error) {
    logger.error('Failed to get feedback by appointment', {
      error: error.message,
      appointmentId
    });
    throw error;
  }
}

/**
 * Check if feedback exists for appointment
 * @param {number} appointmentId - Appointment ID
 * @returns {Promise<boolean>} True if exists
 */
export async function feedbackExists(appointmentId) {
  try {
    const result = await executeQuery(
      'SELECT COUNT(*) AS Count FROM Feedback WHERE AppointmentID = @appointmentId',
      { appointmentId: [sql.Int, appointmentId] }
    );

    return result.recordset[0].Count > 0;
  } catch (error) {
    logger.error('Failed to check feedback existence', {
      error: error.message,
      appointmentId
    });
    throw error;
  }
}

export default {
  createFeedback,
  getFeedbackByCounselor,
  getFeedbackByStudent,
  getFeedbackByAppointment,
  feedbackExists
};
