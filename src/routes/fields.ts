import { Router } from 'express';
import { FieldController } from '@/controllers/fieldController';
import { authenticate, requireAdmin } from '@/middleware/auth';

const router = Router();

// Field routes
router.post('/', authenticate, requireAdmin, FieldController.createField);
router.get('/', authenticate, requireAdmin, FieldController.getFields);
router.get('/:id', authenticate, requireAdmin, FieldController.getFieldById);
router.get('/year/:yearId', authenticate, requireAdmin, FieldController.getFieldsByYear);
router.put('/:id', authenticate, requireAdmin, FieldController.updateField);
router.delete('/:id', authenticate, requireAdmin, FieldController.deleteField);

export default router;
