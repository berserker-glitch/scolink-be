import { Request, Response } from 'express';
import { PaddleService } from '@/services/paddleService';
import { PlanService } from '@/services/planService';
import { logger } from '@/utils/logger';
import { AuthenticatedRequest } from '@/types/common';
import { z } from 'zod';

// Validation schemas
const updatePlanSchema = z.object({
  plan: z.enum(['basic', 'pro', 'premium', 'lifetime'])
});

export class PlanController {
  /**
   * Update center plan (for basic plan selection)
   */
  static updateCenterPlan = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const centerId = req.user?.centerId;
      
      if (!userId || !centerId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          errors: ['User not authenticated or not associated with a center'],
        });
        return;
      }

      const validation = updatePlanSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid request data',
          errors: validation.error.errors.map(err => err.message),
        });
        return;
      }

      const { plan } = validation.data;

      if (req.user?.role !== 'center_admin') {
        res.status(403).json({
          success: false,
          message: 'Only center admins can change plans',
          errors: ['Insufficient permissions'],
        });
        return;
      }

      if (plan !== 'basic') {
        res.status(403).json({
          success: false,
          message: 'Paid plans must be activated through checkout',
          errors: ['Paid plans are activated by verified payment webhooks'],
        });
        return;
      }

      const updatedCenter = await PlanService.updateCenterPlan(centerId, plan);
      
      res.status(200).json({
        success: true,
        data: updatedCenter,
        message: 'Plan updated successfully',
      });

    } catch (error) {
      logger.error('Update center plan failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId
      });
      
      if (error instanceof Error && 'statusCode' in error) {
        res.status((error as any).statusCode).json({
          success: false,
          message: error.message,
          errors: [error.message],
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        errors: ['Plan update failed'],
      });
    }
  };

  /**
   * Get center plan status
   */
  static getCenterPlanStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const centerId = req.user?.centerId;
      
      // Debug logging
      logger.info('Plan status request debug', {
        userId: req.user?.userId,
        centerId: req.user?.centerId,
        userRole: req.user?.role,
        userEmail: req.user?.email
      });
      
      if (!centerId) {
        logger.warn('No centerId found in token', { user: req.user });
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          errors: ['User not associated with a center'],
        });
        return;
      }

      const planStatus = await PlanService.getCenterPlanStatus(centerId);
      const needsPlanSelection = await PaddleService.centerNeedsPlanSelection(centerId);
      
      res.status(200).json({
        success: true,
        data: {
          ...planStatus,
          needsPlanSelection
        },
        message: 'Plan status retrieved successfully',
      });

    } catch (error) {
      logger.error('Get center plan status failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId
      });
      
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        errors: ['Failed to get plan status'],
      });
    }
  };
}
