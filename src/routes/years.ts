import { Router } from 'express';
import { YearController } from '@/controllers/yearController';
import { authenticate, requireAdmin } from '@/middleware/auth';

const router = Router();

// Year routes
router.post('/', authenticate, requireAdmin, YearController.createYear);
router.get('/', authenticate, requireAdmin, YearController.getYears);
router.get('/:id', authenticate, requireAdmin, YearController.getYearById);
router.get('/:id/fields', authenticate, requireAdmin, YearController.getYearWithFields);
router.put('/:id', authenticate, requireAdmin, YearController.updateYear);
router.delete('/:id', authenticate, requireAdmin, YearController.deleteYear);

export default router;
