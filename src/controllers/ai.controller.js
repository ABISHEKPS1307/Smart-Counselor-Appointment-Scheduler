/**
 * AI Controller
 * Business logic for AI operations
 */

import { queryAI, getCacheStats } from '../utils/aiClient.js';
import * as appointmentsModel from '../models/appointments.model.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';
import { trackAIRequest } from '../telemetry.js';
import logger from '../utils/logger.js';

/**
 * Handle AI query
 */
export async function handleAIQuery(req, res, next) {
  try {
    const { prompt, mode } = req.body;
    const startTime = Date.now();
    
    // Call AI service
    const result = await queryAI(prompt, mode);
    const duration = Date.now() - startTime;
    
    // Track telemetry
    trackAIRequest(req.user.id, mode, duration, result.cached);
    
    // Log AI interaction to database
    await appointmentsModel.logAIInteraction({
      userId: req.user.id,
      userType: req.user.role,
      prompt,
      response: result.response,
      mode,
      duration,
      cached: result.cached
    });
    
    logger.info('AI query processed', { 
      userId: req.user.id,
      mode,
      duration,
      cached: result.cached
    });
    
    return sendSuccess(res, {
      response: result.response,
      mode: result.mode,
      cached: result.cached
    }, 'AI query successful');
  } catch (error) {
    logger.error('AI query failed', {
      error: error.message,
      userId: req.user.id,
      mode: req.body.mode
    });
    
    if (error.message.includes('AI service')) {
      return sendError(res, error.message, 503);
    }
    
    next(error);
  }
}

/**
 * Get AI cache statistics (admin only)
 */
export async function getCacheStatistics(req, res, next) {
  try {
    const stats = getCacheStats();
    
    return sendSuccess(res, { cache: stats }, 'Cache statistics retrieved');
  } catch (error) {
    next(error);
  }
}

export default {
  handleAIQuery,
  getCacheStatistics
};
