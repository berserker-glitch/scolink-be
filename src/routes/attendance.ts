import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireAttendanceAccess } from '../middleware/planRestrictions';
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
  getGroupMonthlyAttendance,
} from '../controllers/attendanceController';

const router = Router();

// All attendance routes require authentication and attendance access
router.use(authenticate);
router.use(requireAttendanceAccess);

// Attendance CRUD routes
router.post('/', createAttendanceRecord);
router.post('/bulk', bulkCreateAttendance);

// Get attendance routes
router.get('/enrollment/:enrollmentId', getAttendanceByEnrollment);
router.get('/group/:groupId', getAttendanceByGroup);
router.get('/group/:groupId/current-week', getGroupCurrentWeekAttendance);
router.get('/group/:groupId/date/:date', getGroupAttendanceByDate);
router.get('/group/:groupId/class-today', checkGroupClassToday);
router.get('/group/:groupId/monthly/:year/:month', getGroupMonthlyAttendance);
router.get('/student/:studentId', getAttendanceByStudent);
router.get('/stats/:groupId', getAttendanceStats);

// Update and delete routes
router.put('/:id', updateAttendanceRecord);
router.delete('/:id', deleteAttendanceRecord);

export default router;
