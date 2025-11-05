/**
 * Health Routes
 * Health check endpoint
 */

import express from 'express';
import { isDbConnected } from '../models/db.js';
import { sendSuccess } from '../utils/responseHelper.js';

const router = express.Router();

router.get('/', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Smart Counselor Appointment Scheduler',
    database: isDbConnected() ? 'connected' : 'disconnected',
    uptime: process.uptime()
  };
  
  return sendSuccess(res, health, 'Service is healthy');
});

export default router;
