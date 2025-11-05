/**
 * Application Insights Telemetry
 * Custom event tracking and metrics
 */

import appInsights from 'applicationinsights';
import config from './config.js';
import logger from './utils/logger.js';

let telemetryClient = null;

/**
 * Initialize Application Insights
 */
export function initializeTelemetry() {
  if (!config.appInsights.connectionString && !config.appInsights.instrumentationKey) {
    logger.info('Application Insights not configured');
    return null;
  }
  
  try {
    if (config.appInsights.connectionString) {
      appInsights.setup(config.appInsights.connectionString)
        .setAutoDependencyCorrelation(true)
        .setAutoCollectRequests(true)
        .setAutoCollectPerformance(true, true)
        .setAutoCollectExceptions(true)
        .setAutoCollectDependencies(true)
        .setAutoCollectConsole(true)
        .setUseDiskRetryCaching(true)
        .setSendLiveMetrics(false)
        .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C)
        .start();
      
      telemetryClient = appInsights.defaultClient;
      logger.info('✅ Application Insights initialized');
    }
  } catch (error) {
    logger.error('Failed to initialize Application Insights', { error: error.message });
  }
  
  return telemetryClient;
}

/**
 * Track custom event
 * @param {string} name - Event name
 * @param {object} properties - Event properties
 * @param {object} measurements - Event measurements
 */
export function trackEvent(name, properties = {}, measurements = {}) {
  if (telemetryClient) {
    telemetryClient.trackEvent({
      name,
      properties,
      measurements
    });
  }
  logger.debug('Event tracked', { name, properties });
}

/**
 * Track user login
 * @param {string} userId - User ID
 * @param {string} role - User role
 * @param {boolean} success - Login success
 */
export function trackLogin(userId, role, success) {
  trackEvent('UserLogin', {
    userId,
    role,
    success: String(success)
  });
}

/**
 * Track appointment booking
 * @param {number} studentId - Student ID
 * @param {number} counselorId - Counselor ID
 * @param {string} date - Appointment date
 */
export function trackAppointmentBooked(studentId, counselorId, date) {
  trackEvent('AppointmentBooked', {
    studentId: String(studentId),
    counselorId: String(counselorId),
    date
  });
}

/**
 * Track AI request
 * @param {string} userId - User ID
 * @param {string} mode - AI mode
 * @param {number} duration - Request duration in ms
 * @param {boolean} cached - Was response cached
 */
export function trackAIRequest(userId, mode, duration, cached) {
  trackEvent('AIRequest', {
    userId,
    mode,
    cached: String(cached)
  }, {
    duration
  });
}

/**
 * Track metric
 * @param {string} name - Metric name
 * @param {number} value - Metric value
 * @param {object} properties - Metric properties
 */
export function trackMetric(name, value, properties = {}) {
  if (telemetryClient) {
    telemetryClient.trackMetric({
      name,
      value,
      properties
    });
  }
}

/**
 * Track exception
 * @param {Error} error - Error object
 * @param {object} properties - Additional properties
 */
export function trackException(error, properties = {}) {
  if (telemetryClient) {
    telemetryClient.trackException({
      exception: error,
      properties
    });
  }
  logger.error('Exception tracked', { error: error.message, properties });
}

/**
 * Track dependency (external API calls)
 * @param {string} name - Dependency name
 * @param {string} command - Command/operation
 * @param {number} duration - Duration in ms
 * @param {boolean} success - Success status
 */
export function trackDependency(name, command, duration, success) {
  if (telemetryClient) {
    telemetryClient.trackDependency({
      name,
      data: command,
      duration,
      success,
      resultCode: success ? 200 : 500
    });
  }
}

export default {
  initializeTelemetry,
  trackEvent,
  trackLogin,
  trackAppointmentBooked,
  trackAIRequest,
  trackMetric,
  trackException,
  trackDependency
};
