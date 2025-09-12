import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import centerRoutes from './centers';
import yearRoutes from './years';
import fieldRoutes from './fields';
import subjectRoutes from './subjects';
import teacherRoutes from './teachers';
import groupRoutes from './groups';
import studentRoutes from './students';
import attendanceRoutes from './attendance';
import eventRoutes from './events';
import paymentRoutes from './payments';

const router = Router();

// API versioning
router.use('/api/v1/auth', authRoutes);
router.use('/api/v1/users', userRoutes);
router.use('/api/v1/centers', centerRoutes);
router.use('/api/v1/years', yearRoutes);
router.use('/api/v1/fields', fieldRoutes);
router.use('/api/v1/subjects', subjectRoutes);
router.use('/api/v1/teachers', teacherRoutes);
  router.use('/api/v1/groups', groupRoutes);
router.use('/api/v1/students', studentRoutes);
router.use('/api/v1/attendance', attendanceRoutes);
router.use('/api/v1/events', eventRoutes);
router.use('/api/v1/payments', paymentRoutes);

export default router;
