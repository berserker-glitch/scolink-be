import { Router } from 'express';
import { GroupController } from '@/controllers/groupController';
import { authenticate, requireAdmin } from '@/middleware/auth';

const router = Router();

// Group routes
router.post('/', authenticate, requireAdmin, GroupController.createGroup);
router.get('/', authenticate, requireAdmin, GroupController.getGroups);
router.get('/:id', authenticate, requireAdmin, GroupController.getGroupById);
router.get('/:id/details', authenticate, requireAdmin, GroupController.getGroupWithDetails);
router.get('/:id/students', authenticate, requireAdmin, GroupController.getGroupStudents);
router.get('/subject/:subjectId', authenticate, requireAdmin, GroupController.getGroupsBySubject);
router.put('/:id', authenticate, requireAdmin, GroupController.updateGroup);
router.delete('/:id', authenticate, requireAdmin, GroupController.deleteGroup);

export default router;
