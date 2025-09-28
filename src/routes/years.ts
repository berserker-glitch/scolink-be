import { Router } from 'express';
import { YearController } from '@/controllers/yearController';
import { authenticate, requireStaffAccess } from '@/middleware/auth';

const router = Router();

// Year routes
router.post('/', authenticate, requireStaffAccess, YearController.createYear);
router.get('/', authenticate, requireStaffAccess, YearController.getYears);
router.get('/:id', authenticate, requireStaffAccess, YearController.getYearById);
router.get('/:id/fields', authenticate, requireStaffAccess, YearController.getYearWithFields);
router.put('/:id', authenticate, requireStaffAccess, YearController.updateYear);
router.delete('/:id', authenticate, requireStaffAccess, YearController.deleteYear);

export default router;
