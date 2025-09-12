import { Router } from 'express';
import { UserController } from '@/controllers/userController';
import { authenticate, requireAdmin, requireSuperAdmin } from '@/middleware/auth';

const router = Router();

// Profile routes (authenticated users)
router.get('/profile', authenticate, UserController.getProfile);
router.put('/profile', authenticate, UserController.updateProfile);

// User management routes (admin only)
router.get('/', authenticate, requireAdmin, UserController.getUsers);
router.get('/:id', authenticate, requireAdmin, UserController.getUserById);
router.post('/', authenticate, requireSuperAdmin, UserController.createUser);
router.put('/:id', authenticate, requireSuperAdmin, UserController.updateUser);
router.delete('/:id', authenticate, requireSuperAdmin, UserController.deleteUser);
router.put('/:id/suspend', authenticate, requireSuperAdmin, UserController.suspendUser);
router.put('/:id/unsuspend', authenticate, requireSuperAdmin, UserController.unsuspendUser);

export default router;
