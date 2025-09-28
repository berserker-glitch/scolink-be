import { Router } from 'express';
import { GroupController } from '@/controllers/groupController';
import { authenticate, requireStaffAccess } from '@/middleware/auth';

const router = Router();

// Group routes
router.post('/', authenticate, requireStaffAccess, GroupController.createGroup);
router.get('/', authenticate, requireStaffAccess, GroupController.getGroups);
router.get('/:id', authenticate, requireStaffAccess, GroupController.getGroupById);
router.get('/:id/details', authenticate, requireStaffAccess, GroupController.getGroupWithDetails);
router.get('/:id/students', authenticate, requireStaffAccess, GroupController.getGroupStudents);
router.get('/subject/:subjectId', authenticate, requireStaffAccess, GroupController.getGroupsBySubject);
router.put('/:id', authenticate, requireStaffAccess, GroupController.updateGroup);
router.delete('/:id', authenticate, requireStaffAccess, GroupController.deleteGroup);

export default router;
