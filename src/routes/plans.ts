import { Router } from 'express';
import { PlanController } from '@/controllers/planController';
import { authenticate } from '@/middleware/auth';

const router = Router();

// All plan routes require authentication
router.use(authenticate);

// Update center plan (for basic plan)
router.put('/plan', PlanController.updateCenterPlan);

// Get center plan status
router.get('/plan-status', PlanController.getCenterPlanStatus);

export default router;
