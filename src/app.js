/**
 * Express Application Configuration
 * Main app setup with middleware and routes
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import config from './config.js';
import logger from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import correlationId from './middleware/correlationId.js';

// Import routes
import healthRoutes from './routes/health.routes.js';
import studentsRoutes from './routes/students.routes.js';
import counselorsRoutes from './routes/counselors.routes.js';
import appointmentsRoutes from './routes/appointments.routes.js';
import aiRoutes from './routes/ai.routes.js';
import feedbackRoutes from './routes/feedback.routes.js';

// Swagger documentation
import { setupSwagger } from './swagger.js';

const app = express();

// Trust proxy (for Azure App Service)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://unpkg.com'],
      scriptSrcAttr: ["'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://unpkg.com']
    }
  }
}));

// CORS
app.use(cors(config.cors));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
if (config.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: message => logger.info(message.trim()) }
  }));
}

// Correlation ID for distributed tracing
app.use(correlationId);

// Global rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: { success: false, error: { message: 'Too many requests', code: 429 } },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Cache control for static files
app.use((req, res, next) => {
  // version.json should NEVER be cached
  if (req.path === '/version.json') {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }
  // HTML files - minimal cache (check for updates)
  else if (req.path.endsWith('.html') || req.path === '/') {
    res.setHeader('Cache-Control', 'no-cache, must-revalidate');
  }
  // CSS/JS with version query - cache for 1 year
  else if ((req.path.endsWith('.css') || req.path.endsWith('.js')) && req.query.v) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  // CSS/JS without version - cache for 1 hour only
  else if (req.path.endsWith('.css') || req.path.endsWith('.js')) {
    res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
  }
  // Images and other assets - cache for 1 week
  else if (req.path.match(/\.(jpg|jpeg|png|gif|ico|svg|webp|woff|woff2|ttf|eot)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=604800');
  }
  next();
});

// Serve static files
app.use(express.static('public'));

// Fallback endpoint for version.json if static file doesn't exist
app.get('/version.json', (req, res) => {
  const version = {
    version: `1.${process.env.GIT_COMMIT_HASH || 'unknown'}.${Date.now()}`,
    commitHash: process.env.GIT_COMMIT_HASH || 'unknown',
    branch: 'main',
    buildTime: new Date().toISOString(),
    buildTimestamp: Date.now()
  };
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.json(version);
});

// Setup Swagger documentation
setupSwagger(app);

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/counselors', counselorsRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/feedback', feedbackRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;
