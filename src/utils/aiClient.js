/**
 * Azure OpenAI Client
 * Handles AI requests with caching and rate limiting
 */

import axios from 'axios';
import { LRUCache } from 'lru-cache';
import config from '../config.js';
import logger from './logger.js';
import { getSecret } from './keyVaultClient.js';

// Initialize LRU cache for AI responses
const aiCache = new LRUCache({
  max: 100,
  ttl: config.openai.cacheTTL * 60 * 1000, // Convert minutes to milliseconds
  updateAgeOnGet: false,
  updateAgeOnHas: false
});

let openaiApiKey = null;

/**
 * Initialize OpenAI API key from Key Vault
 */
async function initializeOpenAI() {
  openaiApiKey = await getSecret('AZURE-OPENAI-API-KEY', 'AZURE_OPENAI_API_KEY');
  
  if (!openaiApiKey) {
    logger.warn('Azure OpenAI API key not configured');
  } else {
    logger.info('Azure OpenAI client initialized');
  }
}

// Initialize on module load
initializeOpenAI();

/**
 * Generate cache key from prompt and mode
 * @param {string} prompt - User prompt
 * @param {string} mode - AI mode
 * @returns {string} Cache key
 */
function generateCacheKey(prompt, mode) {
  return `${mode}:${prompt.toLowerCase().trim()}`;
}

/**
 * Call Azure OpenAI API
 * @param {string} prompt - User prompt
 * @param {string} mode - Mode (chat, summarizeFeedback, recommendation)
 * @param {object} options - Additional options
 * @returns {Promise<object>} AI response
 */
export async function queryAI(prompt, mode = 'chat', options = {}) {
  // Validate inputs
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Invalid prompt');
  }
  
  const validModes = ['chat', 'summarizeFeedback', 'recommendation', 'wellbeing_tips', 'analyzeFeedback'];
  if (!validModes.includes(mode)) {
    throw new Error(`Invalid mode. Must be one of: ${validModes.join(', ')}`);
  }
  
  // Check cache first
  const cacheKey = generateCacheKey(prompt, mode);
  const cachedResponse = aiCache.get(cacheKey);
  
  if (cachedResponse) {
    logger.debug('AI cache hit', { mode, promptLength: prompt.length });
    return {
      response: cachedResponse,
      cached: true,
      mode
    };
  }
  
  // Check if API key is available
  if (!openaiApiKey) {
    logger.error('Azure OpenAI API key not available');
    throw new Error('AI service not configured');
  }
  
  // Build system message based on mode
  let systemMessage = '';
  let maxTokens = options.maxTokens || 500;
  
  switch (mode) {
    case 'chat':
      systemMessage = 'You are a helpful AI assistant for a counselor appointment scheduler. Provide concise, supportive, and helpful responses. Never provide medical advice or diagnoses. If a student mentions serious mental health concerns, suicide, self-harm, or crisis situations, always recommend they contact a real counselor immediately or call emergency services. Keep responses positive and safe.';
      break;
    case 'wellbeing_tips':
      systemMessage = 'You are a wellbeing assistant providing general wellness tips and stress management advice. Provide simple, actionable, and positive suggestions for students. Never provide medical advice or diagnoses. Keep responses brief and supportive. If serious issues are mentioned, recommend consulting a real counselor.';
      break;
    case 'recommendation':
      systemMessage = 'You are an AI counselor recommendation assistant. Based on the student\'s needs, suggest the most suitable counselor type (Academic, Career, Personal, or Mental Health) and explain why. Be concise and helpful. For serious mental health concerns, always recommend Mental Health counselors and suggest seeking immediate help.';
      break;
    case 'analyzeFeedback':
      systemMessage = 'You are an AI feedback analyzer. Analyze the student feedback and return a JSON object with: {"rating": <1-5>, "sentiment": "<positive|neutral|negative>", "summary": "<brief summary>", "improvementSuggestions": "<optional suggestions for counselor>"}. Base rating on the overall tone and content. Be objective and constructive.';
      maxTokens = 300;
      break;
    case 'summarizeFeedback':
      systemMessage = 'You are an AI assistant that summarizes student feedback. Extract key points, sentiment, and actionable insights. Be concise.';
      break;
  }
  
  // Prepare request
  const endpoint = `${config.openai.endpoint}/openai/deployments/${config.openai.deploymentName}/chat/completions?api-version=${config.openai.apiVersion}`;
  
  const requestBody = {
    messages: [
      { role: 'system', content: systemMessage },
      { role: 'user', content: prompt }
    ],
    max_tokens: maxTokens,
    temperature: options.temperature || 0.7,
    top_p: options.topP || 0.95,
    frequency_penalty: 0,
    presence_penalty: 0
  };
  
  const startTime = Date.now();
  
  try {
    const response = await axios.post(endpoint, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'api-key': openaiApiKey
      },
      timeout: 30000 // 30 second timeout
    });
    
    const duration = Date.now() - startTime;
    const aiResponse = response.data.choices[0].message.content;
    
    // Cache the response
    aiCache.set(cacheKey, aiResponse);
    
    logger.info('AI request completed', {
      mode,
      duration,
      promptLength: prompt.length,
      responseLength: aiResponse.length,
      tokens: response.data.usage?.total_tokens
    });
    
    return {
      response: aiResponse,
      cached: false,
      mode,
      usage: response.data.usage
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('AI request failed', {
      mode,
      duration,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    
    // Provide user-friendly error messages
    if (error.response?.status === 401) {
      throw new Error('AI service authentication failed');
    } else if (error.response?.status === 429) {
      throw new Error('AI service rate limit exceeded. Please try again later');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('AI service request timeout');
    } else {
      throw new Error('AI service temporarily unavailable');
    }
  }
}

/**
 * Clear AI cache
 */
export function clearCache() {
  aiCache.clear();
  logger.info('AI cache cleared');
}

/**
 * Get cache statistics
 * @returns {object} Cache stats
 */
export function getCacheStats() {
  return {
    size: aiCache.size,
    max: aiCache.max,
    ttl: config.openai.cacheTTL
  };
}

export default {
  queryAI,
  clearCache,
  getCacheStats
};
