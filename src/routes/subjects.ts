import { Router } from 'express';
import { SubjectController } from '@/controllers/subjectController';
import { authenticate, requireAdmin } from '@/middleware/auth';

const router = Router();

// Subject routes
router.post('/', authenticate, requireAdmin, SubjectController.createSubject);
router.get('/', authenticate, requireAdmin, SubjectController.getSubjects);
router.get('/:id', authenticate, requireAdmin, SubjectController.getSubjectById);
router.get('/:id/groups', authenticate, requireAdmin, SubjectController.getSubjectWithGroups);
router.get('/field/:fieldId', authenticate, requireAdmin, SubjectController.getSubjectsByField);
router.put('/:id', authenticate, requireAdmin, SubjectController.updateSubject);
router.delete('/:id', authenticate, requireAdmin, SubjectController.deleteSubject);

export default router;
