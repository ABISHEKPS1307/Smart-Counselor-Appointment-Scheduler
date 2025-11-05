/**
 * Server Entry Point
 * Application startup and graceful shutdown
 */

import app from './app.js';
import { validateConfig } from './config.js';
import { initializeDatabase, closeDatabase } from './models/db.js';
import { initializeTelemetry } from './telemetry.js';
import logger from './utils/logger.js';
import config from './config.js';

// Validate configuration
try {
  validateConfig();
  logger.info('Configuration validated successfully');
} catch (error) {
  logger.error('Configuration validation failed', { error: error.message });
  process.exit(1);
}

// Initialize Application Insights
initializeTelemetry();

// Start server
async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();
    
    // Start listening
    const server = app.listen(config.port, () => {
      logger.info(`?? Server started on port ${config.port}`);
      logger.info(`?? Environment: ${config.env}`);
      logger.info(`?? Database: ${config.database.server}/${config.database.database}`);
      logger.info(`?? Key Vault: ${config.keyVault.enabled ? 'Enabled' : 'Disabled'}`);
      logger.info(`?? API Docs: http://localhost:${config.port}/api-docs`);
      logger.info('? Server is ready to accept connections');
    });
    
    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received, starting graceful shutdown`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          await closeDatabase();
          logger.info('? Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown', { error: error.message });
          process.exit(1);
        }
      });
      
      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };
    
    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { error: error.message, stack: error.stack });
      gracefulShutdown('uncaughtException');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection', { reason, promise });
    });
    
  } catch (error) {
    logger.error('Failed to start server', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Start the server
startServer();
 
