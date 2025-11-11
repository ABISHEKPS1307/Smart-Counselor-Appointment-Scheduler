/**
 * Feedback Controller
 * Business logic for feedback operations with AI analysis
 */

import * as feedbackModel from '../models/feedback.model.js';
import * as appointmentsModel from '../models/appointments.model.js';
import { queryAI } from '../utils/aiClient.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';
import logger from '../utils/logger.js';

/**
 * Submit feedback with AI analysis
 */
export async function submitFeedback(req, res, next) {
  try {
    const { appointmentID, studentID, counselorID, feedback } = req.body;

    // Validate input
    if (!appointmentID || !studentID || !counselorID || !feedback) {
      return sendError(res, 'Missing required fields', 400);
    }

    if (feedback.length < 10) {
      return sendError(res, 'Feedback must be at least 10 characters', 400);
    }

    // Verify student is submitting feedback for their own appointment
    if (req.user.role === 'student' && req.user.studentID !== studentID) {
      return sendError(res, 'Cannot submit feedback for another student', 403);
    }

    // Verify appointment exists and belongs to the student
    const appointment = await appointmentsModel.getAppointmentById(appointmentID);
    if (!appointment) {
      return sendError(res, 'Appointment not found', 404);
    }

    if (appointment.StudentID !== studentID || appointment.CounselorID !== counselorID) {
      return sendError(res, 'Invalid appointment data', 400);
    }

    // Check if appointment is completed (optional validation)
    // You can add status check here if needed

    // Check if feedback already exists
    const existingFeedback = await feedbackModel.getFeedbackByAppointment(appointmentID);
    if (existingFeedback) {
      return sendError(res, 'Feedback already submitted for this appointment', 409);
    }

    // Try to analyze feedback with AI (graceful fallback if unavailable)
    let aiAnalysis;
    let aiUsed = false;
    
    try {
      logger.info('Analyzing feedback with AI', { appointmentID, studentID });
      const aiPrompt = `Analyze this student feedback about a counseling session and provide structured analysis:

Feedback: "${feedback}"

Return a JSON object with the following structure:
{
  "rating": <number 1-5 based on sentiment and content>,
  "sentiment": "<positive|neutral|negative>",
  "summary": "<1-2 sentence summary of key points>",
  "improvementSuggestions": "<optional constructive suggestions for the counselor>"
}

Be objective, constructive, and professional. Base the rating on overall satisfaction expressed.`;

      const aiResult = await queryAI(aiPrompt, 'analyzeFeedback', {
        temperature: 0.3, // Lower temperature for more consistent analysis
        maxTokens: 300
      });

      // Parse AI response
      try {
        // Extract JSON from response (handle cases where AI adds markdown code blocks)
        let jsonStr = aiResult.response.trim();
        if (jsonStr.startsWith('```json')) {
          jsonStr = jsonStr.substring(7);
        }
        if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.substring(3);
        }
        if (jsonStr.endsWith('```')) {
          jsonStr = jsonStr.substring(0, jsonStr.length - 3);
        }
        jsonStr = jsonStr.trim();

        aiAnalysis = JSON.parse(jsonStr);

        // Validate AI analysis structure
        if (!aiAnalysis.rating || !aiAnalysis.sentiment || !aiAnalysis.summary) {
          throw new Error('Incomplete AI analysis');
        }

        // Validate rating range
        if (aiAnalysis.rating < 1 || aiAnalysis.rating > 5) {
          aiAnalysis.rating = 3; // Default to neutral
        }

        // Validate sentiment
        if (!['positive', 'neutral', 'negative'].includes(aiAnalysis.sentiment)) {
          aiAnalysis.sentiment = 'neutral';
        }
        
        aiUsed = true;
        
        // Log AI interaction
        await appointmentsModel.logAIInteraction({
          userId: req.user.id,
          userType: req.user.role,
          prompt: aiPrompt,
          response: aiResult.response,
          mode: 'analyzeFeedback',
          duration: 0, // Duration tracked by aiClient
          cached: aiResult.cached
        });
      } catch (parseError) {
        logger.error('Failed to parse AI analysis', {
          error: parseError.message,
          response: aiResult.response
        });

        // Fallback to default values
        aiAnalysis = {
          rating: 3,
          sentiment: 'neutral',
          summary: 'Thank you for your feedback.',
          improvementSuggestions: null
        };
      }
    } catch (aiError) {
      // AI service not available - use default values and continue
      logger.warn('AI analysis unavailable, using default values', {
        error: aiError.message,
        appointmentID,
        studentID
      });
      
      aiAnalysis = {
        rating: 3,
        sentiment: 'neutral',
        summary: 'Thank you for your feedback.',
        improvementSuggestions: null
      };
    }

    // Store feedback in database
    const createdFeedback = await feedbackModel.createFeedback({
      appointmentID,
      studentID,
      counselorID,
      feedbackText: feedback,
      rating: aiAnalysis.rating,
      sentiment: aiAnalysis.sentiment,
      summary: aiAnalysis.summary,
      improvementSuggestions: aiAnalysis.improvementSuggestions || null
    });

    logger.info('Feedback submitted successfully', {
      feedbackId: createdFeedback.FeedbackID,
      appointmentID,
      studentID,
      counselorID,
      rating: aiAnalysis.rating,
      sentiment: aiAnalysis.sentiment,
      aiUsed
    });

    // Return analysis to frontend
    return sendSuccess(
      res,
      {
        feedback: createdFeedback,
        analysis: {
          rating: aiAnalysis.rating,
          sentiment: aiAnalysis.sentiment,
          summary: aiAnalysis.summary,
          aiAnalyzed: aiUsed
        }
      },
      aiUsed ? 'Feedback submitted and analyzed successfully' : 'Feedback submitted successfully',
      201
    );
  } catch (error) {
    logger.error('Submit feedback failed', {
      error: error.message,
      userId: req.user.id
    });
    next(error);
  }
}

/**
 * Get feedback for a counselor
 */
export async function getCounselorFeedback(req, res, next) {
  try {
    const { counselorId } = req.params;
    const parsedCounselorId = parseInt(counselorId);

    // Verify counselor is requesting their own feedback (unless admin)
    if (req.user.role === 'counselor' && req.user.counselorID !== parsedCounselorId) {
      return sendError(res, 'Cannot view feedback of another counselor', 403);
    }

    const result = await feedbackModel.getFeedbackByCounselor(parsedCounselorId);

    logger.info('Counselor feedback retrieved', {
      counselorId: parsedCounselorId,
      count: result.feedback.length,
      avgRating: result.statistics.averageRating
    });

    return sendSuccess(res, result, 'Feedback retrieved successfully');
  } catch (error) {
    logger.error('Get counselor feedback failed', {
      error: error.message,
      counselorId: req.params.counselorId
    });
    next(error);
  }
}

/**
 * Get feedback by student
 */
export async function getStudentFeedback(req, res, next) {
  try {
    const { studentId } = req.params;
    const parsedStudentId = parseInt(studentId);

    // Verify student is requesting their own feedback (unless admin)
    if (req.user.role === 'student' && req.user.studentID !== parsedStudentId) {
      return sendError(res, 'Cannot view feedback of another student', 403);
    }

    const feedback = await feedbackModel.getFeedbackByStudent(parsedStudentId);

    logger.info('Student feedback retrieved', {
      studentId: parsedStudentId,
      count: feedback.length
    });

    return sendSuccess(res, { feedback }, 'Feedback retrieved successfully');
  } catch (error) {
    logger.error('Get student feedback failed', {
      error: error.message,
      studentId: req.params.studentId
    });
    next(error);
  }
}

/**
 * Get feedback by appointment
 */
export async function getAppointmentFeedback(req, res, next) {
  try {
    const { appointmentId } = req.params;
    const parsedAppointmentId = parseInt(appointmentId);

    // Get appointment to verify access
    const appointment = await appointmentsModel.getAppointmentById(parsedAppointmentId);
    if (!appointment) {
      return sendError(res, 'Appointment not found', 404);
    }

    // Verify user has access to this appointment
    const hasAccess =
      (req.user.role === 'student' && req.user.studentID === appointment.StudentID) ||
      (req.user.role === 'counselor' && req.user.counselorID === appointment.CounselorID) ||
      req.user.role === 'admin';

    if (!hasAccess) {
      return sendError(res, 'Access denied', 403);
    }

    const feedback = await feedbackModel.getFeedbackByAppointment(parsedAppointmentId);

    if (!feedback) {
      return sendSuccess(res, { feedback: null }, 'No feedback found for this appointment');
    }

    return sendSuccess(res, { feedback }, 'Feedback retrieved successfully');
  } catch (error) {
    logger.error('Get appointment feedback failed', {
      error: error.message,
      appointmentId: req.params.appointmentId
    });
    next(error);
  }
}

export default {
  submitFeedback,
  getCounselorFeedback,
  getStudentFeedback,
  getAppointmentFeedback
};
