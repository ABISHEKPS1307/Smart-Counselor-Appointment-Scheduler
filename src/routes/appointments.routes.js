/**
 * Appointments Routes
 * API endpoints for appointment operations
 */

import express from 'express';
import * as appointmentsController from '../controllers/appointments.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validateAppointment } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create appointment
router.post('/', validateAppointment, asyncHandler(appointmentsController.createAppointment));

// Get appointments
router.get('/student/:studentId', asyncHandler(appointmentsController.getStudentAppointments));
router.get('/counselor/:counselorId', asyncHandler(appointmentsController.getCounselorAppointments));
router.get('/:appointmentId', asyncHandler(appointmentsController.getAppointmentById));

// Update appointment
router.patch('/:appointmentId', requireRole('counselor', 'admin'), asyncHandler(appointmentsController.updateStatus));
router.delete('/:appointmentId', asyncHandler(appointmentsController.cancelAppointment));

export default router;
