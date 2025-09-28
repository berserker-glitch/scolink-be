import { Router } from 'express';
import { SubjectController } from '@/controllers/subjectController';
import { authenticate, requireStaffAccess } from '@/middleware/auth';

const router = Router();

// Subject routes
router.post('/', authenticate, requireStaffAccess, SubjectController.createSubject);
router.get('/', authenticate, requireStaffAccess, SubjectController.getSubjects);
router.get('/:id', authenticate, requireStaffAccess, SubjectController.getSubjectById);
router.get('/:id/groups', authenticate, requireStaffAccess, SubjectController.getSubjectWithGroups);
router.get('/field/:fieldId', authenticate, requireStaffAccess, SubjectController.getSubjectsByField);
router.put('/:id', authenticate, requireStaffAccess, SubjectController.updateSubject);
router.delete('/:id', authenticate, requireStaffAccess, SubjectController.deleteSubject);

export default router;
