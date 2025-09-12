import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  enrollStudent,
  unenrollStudent,
  getStudentEnrollments,
  enrollStudentInSubjects,
  updateStudentEnrollment,
  removeStudentEnrollment
} from '../controllers/studentController';
import { createStudentSchema, updateStudentSchema, enrollStudentSchema } from '../types/student';

const router = Router();

// All student routes require authentication
router.use(authenticate);

// Student CRUD routes
router.post('/', validate(createStudentSchema), createStudent);
router.get('/', getStudents);
router.get('/:id', getStudentById);
router.put('/:id', validate(updateStudentSchema), updateStudent);
router.delete('/:id', deleteStudent);

// Enrollment routes
router.post('/enroll', validate(enrollStudentSchema), enrollStudent);
router.delete('/:studentId/groups/:groupId', unenrollStudent);
router.get('/:id/enrollments', getStudentEnrollments);

// New enrollment management routes
router.post('/:studentId/enrollments', enrollStudentInSubjects);
router.put('/:studentId/enrollments/:enrollmentId', updateStudentEnrollment);
router.delete('/:studentId/enrollments/:enrollmentId', removeStudentEnrollment);

export default router;
