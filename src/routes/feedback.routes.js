/**
 * Feedback Routes
 * API endpoints for feedback operations
 */

import express from 'express';
import * as feedbackController from '../controllers/feedback.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiter for feedback submission
const feedbackRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 feedback submissions per 15 minutes
  message: {
    success: false,
    error: { message: 'Too many feedback submissions. Please try again later.', code: 429 }
  },
  standardHeaders: true,
  legacyHeaders: false
});

// All routes require authentication
router.use(authenticate);

/**
 * @route POST /api/feedback
 * @desc Submit feedback with AI analysis
 * @access Student
 */
router.post(
  '/',
  requireRole('student'),
  feedbackRateLimiter,
  asyncHandler(feedbackController.submitFeedback)
);

/**
 * @route GET /api/feedback/counselor/:counselorId
 * @desc Get all feedback for a counselor with average rating
 * @access Counselor (own), Admin
 */
router.get(
  '/counselor/:counselorId',
  requireRole('counselor', 'admin'),
  asyncHandler(feedbackController.getCounselorFeedback)
);

/**
 * @route GET /api/feedback/student/:studentId
 * @desc Get all feedback by a student
 * @access Student (own), Admin
 */
router.get(
  '/student/:studentId',
  requireRole('student', 'admin'),
  asyncHandler(feedbackController.getStudentFeedback)
);

/**
 * @route GET /api/feedback/appointment/:appointmentId
 * @desc Get feedback for a specific appointment
 * @access Student (own), Counselor (own), Admin
 */
router.get(
  '/appointment/:appointmentId',
  asyncHandler(feedbackController.getAppointmentFeedback)
);

export default router;
