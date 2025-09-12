import { Router } from 'express';
import { AuthController } from '@/controllers/authController';
import { authLimiter } from '@/middleware/rateLimiter';
import { authenticate } from '@/middleware/auth';

const router = Router();

// Apply rate limiting to all auth routes
router.use(authLimiter);

// Authentication routes
router.post('/login', AuthController.login);
router.post('/refresh', AuthController.refreshToken);
router.get('/profile', authenticate, AuthController.getProfile);
router.post('/logout', AuthController.logout);
router.post('/logout-all', AuthController.logoutAll);

export default router;
