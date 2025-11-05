/**
 * Students Routes
 * API endpoints for student operations
 */

import express from 'express';
import * as studentsController from '../controllers/students.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validateStudentRegistration, validateLogin } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * @swagger
 * /api/students/register:
 *   post:
 *     summary: Register a new student
 *     tags: [Students]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       201:
 *         description: Student registered successfully
 *       409:
 *         description: Email already registered
 */
router.post('/register', validateStudentRegistration, asyncHandler(studentsController.register));

/**
 * @swagger
 * /api/students/login:
 *   post:
 *     summary: Student login
 *     tags: [Students]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', validateLogin, asyncHandler(studentsController.login));

/**
 * @swagger
 * /api/students:
 *   get:
 *     summary: Get all students (admin/counselor only)
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of records to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of records to skip
 *     responses:
 *       200:
 *         description: List of students
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticate, requireRole('admin', 'counselor'), asyncHandler(studentsController.getAllStudents));

/**
 * @swagger
 * /api/students/profile:
 *   get:
 *     summary: Get student profile
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student profile
 *       401:
 *         description: Unauthorized
 */
router.get('/profile', authenticate, requireRole('student'), asyncHandler(studentsController.getProfile));

/**
 * @swagger
 * /api/students/profile:
 *   put:
 *     summary: Update student profile
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 *       401:
 *         description: Unauthorized
 */
router.put('/profile', authenticate, requireRole('student'), asyncHandler(studentsController.updateProfile));

export default router;
