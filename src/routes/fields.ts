import { Router } from 'express';
import { FieldController } from '@/controllers/fieldController';
import { authenticate, requireStaffAccess } from '@/middleware/auth';

const router = Router();

// Field routes
router.post('/', authenticate, requireStaffAccess, FieldController.createField);
router.get('/', authenticate, requireStaffAccess, FieldController.getFields);
router.get('/:id', authenticate, requireStaffAccess, FieldController.getFieldById);
router.get('/year/:yearId', authenticate, requireStaffAccess, FieldController.getFieldsByYear);
router.put('/:id', authenticate, requireStaffAccess, FieldController.updateField);
router.delete('/:id', authenticate, requireStaffAccess, FieldController.deleteField);

export default router;
