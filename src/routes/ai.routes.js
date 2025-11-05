/**
 * AI Routes
 * API endpoints for AI operations
 */

import express from 'express';
import * as aiController from '../controllers/ai.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validateAIQuery } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import rateLimit from 'express-rate-limit';
import config from '../config.js';

const router = express.Router();

// AI-specific rate limiter
const aiRateLimiter = rateLimit({
  windowMs: config.rateLimit.ai.windowMs,
  max: config.rateLimit.ai.max,
  message: { success: false, error: { message: 'Too many AI requests, please try again later', code: 429 } },
  standardHeaders: true,
  legacyHeaders: false
});

// All routes require authentication
router.use(authenticate);

// AI query endpoint with rate limiting
router.post('/query', aiRateLimiter, validateAIQuery, asyncHandler(aiController.handleAIQuery));

// Cache stats (admin only)
router.get('/cache/stats', requireRole('admin'), asyncHandler(aiController.getCacheStatistics));

export default router;
