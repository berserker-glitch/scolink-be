import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createAttendanceRecord,
  bulkCreateAttendance,
  getAttendanceByEnrollment,
  getAttendanceByGroup,
  getAttendanceByStudent,
  updateAttendanceRecord,
  deleteAttendanceRecord,
  getAttendanceStats,
  getGroupCurrentWeekAttendance,
  getGroupAttendanceByDate,
  checkGroupClassToday,
} from '../controllers/attendanceController';

const router = Router();

// All attendance routes require authentication
router.use(authenticate);

// Attendance CRUD routes
router.post('/', createAttendanceRecord);
router.post('/bulk', bulkCreateAttendance);

// Get attendance routes
router.get('/enrollment/:enrollmentId', getAttendanceByEnrollment);
router.get('/group/:groupId', getAttendanceByGroup);
router.get('/group/:groupId/current-week', getGroupCurrentWeekAttendance);
router.get('/group/:groupId/date/:date', getGroupAttendanceByDate);
router.get('/group/:groupId/class-today', checkGroupClassToday);
router.get('/student/:studentId', getAttendanceByStudent);
router.get('/stats/:groupId', getAttendanceStats);

// Update and delete routes
router.put('/:id', updateAttendanceRecord);
router.delete('/:id', deleteAttendanceRecord);

export default router;
