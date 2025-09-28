import { Router } from 'express';
import { TeacherController } from '@/controllers/teacherController';
import { authenticate, requireStaffAccess } from '@/middleware/auth';

const router = Router();

// Teacher routes
router.post('/', authenticate, requireStaffAccess, TeacherController.createTeacher);
router.get('/', authenticate, requireStaffAccess, TeacherController.getTeachers);
router.get('/:id', authenticate, requireStaffAccess, TeacherController.getTeacherById);
router.get('/:id/groups', authenticate, requireStaffAccess, TeacherController.getTeacherWithGroups);
router.put('/:id', authenticate, requireStaffAccess, TeacherController.updateTeacher);
router.put('/:teacherId/activate', authenticate, requireStaffAccess, TeacherController.activateTeacherAccount);
router.delete('/:id', authenticate, requireStaffAccess, TeacherController.deleteTeacher);

export default router;
