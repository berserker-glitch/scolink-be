import { Router } from 'express';
import { CenterController } from '@/controllers/centerController';
import { UserController } from '@/controllers/userController';
import { authenticate, requireSuperAdmin, requireAdmin } from '@/middleware/auth';

const router = Router();

// Center routes
router.post('/', authenticate, requireSuperAdmin, CenterController.createCenter);
router.get('/', authenticate, requireAdmin, CenterController.getCenters);
router.get('/:id', authenticate, requireAdmin, CenterController.getCenterById);
router.get('/:id/admins', authenticate, requireAdmin, CenterController.getCenterWithAdmins);
router.put('/:id', authenticate, requireSuperAdmin, CenterController.updateCenter);
router.delete('/:id', authenticate, requireSuperAdmin, CenterController.deleteCenter);
router.put('/:id/suspend', authenticate, requireSuperAdmin, CenterController.suspendCenter);
router.put('/:id/unsuspend', authenticate, requireSuperAdmin, CenterController.unsuspendCenter);

// Center admin management routes
router.post('/:centerId/admins', authenticate, requireSuperAdmin, UserController.createCenterAdmin);
router.get('/:centerId/admins', authenticate, requireAdmin, UserController.getCenterAdmins);

export default router;
