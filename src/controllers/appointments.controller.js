/**
 * Appointments Controller
 * Business logic for appointment operations
 */

import * as appointmentsModel from '../models/appointments.model.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';
import { trackAppointmentBooked } from '../telemetry.js';
import logger from '../utils/logger.js';

/**
 * Create new appointment
 */
export async function createAppointment(req, res, next) {
  try {
    const { studentID, counselorID, date, time } = req.body;
    
    // Verify student is creating appointment for themselves
    if (req.user.role === 'student' && req.user.studentID !== studentID) {
      return sendError(res, 'Cannot create appointment for another student', 403);
    }
    
    // Create appointment
    const appointment = await appointmentsModel.createAppointment({
      studentID,
      counselorID,
      date,
      time
    });
    
    trackAppointmentBooked(studentID, counselorID, date);
    
    logger.info('Appointment created', { 
      appointmentId: appointment.AppointmentID,
      studentID,
      counselorID,
      date,
      time
    });
    
    return sendSuccess(res, { appointment }, 'Appointment booked successfully', 201);
  } catch (error) {
    if (error.message === 'This time slot is already booked') {
      return sendError(res, 'This time slot is already booked', 409);
    }
    next(error);
  }
}

/**
 * Get appointments by student
 */
export async function getStudentAppointments(req, res, next) {
  try {
    const { studentId } = req.params;
    const parsedStudentId = parseInt(studentId);
    
    // Verify student is requesting their own appointments
    if (req.user.role === 'student' && req.user.studentID !== parsedStudentId) {
      return sendError(res, 'Cannot view appointments of another student', 403);
    }
    
    const appointments = await appointmentsModel.getAppointmentsByStudent(parsedStudentId);
    
    return sendSuccess(res, { appointments }, 'Appointments retrieved successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Get appointments by counselor
 */
export async function getCounselorAppointments(req, res, next) {
  try {
    const { counselorId } = req.params;
    const parsedCounselorId = parseInt(counselorId);
    
    // Verify counselor is requesting their own appointments
    if (req.user.role === 'counselor' && req.user.counselorID !== parsedCounselorId) {
      return sendError(res, 'Cannot view appointments of another counselor', 403);
    }
    
    const appointments = await appointmentsModel.getAppointmentsByCounselor(parsedCounselorId);
    
    return sendSuccess(res, { appointments }, 'Appointments retrieved successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Get appointment by ID
 */
export async function getAppointmentById(req, res, next) {
  try {
    const { appointmentId } = req.params;
    const parsedAppointmentId = parseInt(appointmentId);
    
    const appointment = await appointmentsModel.getAppointmentById(parsedAppointmentId);
    
    if (!appointment) {
      return sendError(res, 'Appointment not found', 404);
    }
    
    // Verify user has access to this appointment
    const hasAccess = 
      (req.user.role === 'student' && req.user.studentID === appointment.StudentID) ||
      (req.user.role === 'counselor' && req.user.counselorID === appointment.CounselorID) ||
      req.user.role === 'admin';
    
    if (!hasAccess) {
      return sendError(res, 'Access denied', 403);
    }
    
    return sendSuccess(res, { appointment }, 'Appointment retrieved successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Update appointment status
 */
export async function updateStatus(req, res, next) {
  try {
    const { appointmentId } = req.params;
    const { status } = req.body;
    const parsedAppointmentId = parseInt(appointmentId);
    
    // Get appointment first to verify ownership
    const appointment = await appointmentsModel.getAppointmentById(parsedAppointmentId);
    
    if (!appointment) {
      return sendError(res, 'Appointment not found', 404);
    }
    
    // Only counselor or admin can update status
    if (req.user.role === 'counselor' && req.user.counselorID !== appointment.CounselorID) {
      return sendError(res, 'Cannot update appointment for another counselor', 403);
    }
    
    // Update status
    const updatedAppointment = await appointmentsModel.updateAppointmentStatus(
      parsedAppointmentId,
      status
    );
    
    logger.info('Appointment status updated', { 
      appointmentId: parsedAppointmentId,
      status,
      updatedBy: req.user.id
    });
    
    return sendSuccess(res, { appointment: updatedAppointment }, 'Status updated successfully');
  } catch (error) {
    if (error.message === 'Invalid status') {
      return sendError(res, 'Invalid status value', 400);
    }
    next(error);
  }
}

/**
 * Cancel appointment
 */
export async function cancelAppointment(req, res, next) {
  try {
    const { appointmentId } = req.params;
    const parsedAppointmentId = parseInt(appointmentId);
    
    // Get appointment first to verify ownership
    const appointment = await appointmentsModel.getAppointmentById(parsedAppointmentId);
    
    if (!appointment) {
      return sendError(res, 'Appointment not found', 404);
    }
    
    // Verify user can cancel
    const canCancel = 
      (req.user.role === 'student' && req.user.studentID === appointment.StudentID) ||
      (req.user.role === 'counselor' && req.user.counselorID === appointment.CounselorID) ||
      req.user.role === 'admin';
    
    if (!canCancel) {
      return sendError(res, 'Cannot cancel this appointment', 403);
    }
    
    // Update status to Cancelled
    const updatedAppointment = await appointmentsModel.updateAppointmentStatus(
      parsedAppointmentId,
      'Cancelled'
    );
    
    logger.info('Appointment cancelled', { 
      appointmentId: parsedAppointmentId,
      cancelledBy: req.user.id
    });
    
    return sendSuccess(res, { appointment: updatedAppointment }, 'Appointment cancelled successfully');
  } catch (error) {
    next(error);
  }
}

export default {
  createAppointment,
  getStudentAppointments,
  getCounselorAppointments,
  getAppointmentById,
  updateStatus,
  cancelAppointment
};
