import { Router } from 'express';
import { TeacherController } from '@/controllers/teacherController';
import { authenticate, requireAdmin } from '@/middleware/auth';

const router = Router();

// Teacher routes
router.post('/', authenticate, requireAdmin, TeacherController.createTeacher);
router.get('/', authenticate, requireAdmin, TeacherController.getTeachers);
router.get('/:id', authenticate, requireAdmin, TeacherController.getTeacherById);
router.get('/:id/groups', authenticate, requireAdmin, TeacherController.getTeacherWithGroups);
router.put('/:id', authenticate, requireAdmin, TeacherController.updateTeacher);
router.delete('/:id', authenticate, requireAdmin, TeacherController.deleteTeacher);

export default router;
