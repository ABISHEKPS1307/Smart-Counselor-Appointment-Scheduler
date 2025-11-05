/**
 * Winston Logger Configuration
 * Structured logging for development and production
 */

import winston from 'winston';
import config from '../config.js';

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

// Custom format for console logging
const consoleFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })
  ),
  defaultMeta: { service: 'counselor-scheduler-api' },
  transports: []
});

// Console transport for development
if (config.env === 'development') {
  logger.add(
    new winston.transports.Console({
      format: combine(
        colorize(),
        consoleFormat
      )
    })
  );
} else {
  // JSON format for production (better for log aggregation)
  logger.add(
    new winston.transports.Console({
      format: json()
    })
  );
}

// File transport for errors
logger.add(
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: json()
  })
);

// File transport for all logs
logger.add(
  new winston.transports.File({
    filename: 'logs/combined.log',
    format: json()
  })
);

export default logger;
