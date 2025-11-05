/**
 * Counselors Routes
 * API endpoints for counselor operations
 */

import express from 'express';
import * as counselorsController from '../controllers/counselors.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validateCounselorRegistration, validateLogin } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Public routes
router.post('/register', validateCounselorRegistration, asyncHandler(counselorsController.register));
router.post('/login', validateLogin, asyncHandler(counselorsController.login));
router.get('/', asyncHandler(counselorsController.getAllCounselors)); // Public for selection

// Protected routes
router.get('/profile', authenticate, requireRole('counselor'), asyncHandler(counselorsController.getProfile));
router.put('/profile', authenticate, requireRole('counselor'), asyncHandler(counselorsController.updateProfile));

export default router;
