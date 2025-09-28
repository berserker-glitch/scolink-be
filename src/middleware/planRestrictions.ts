import { Request, Response, NextFunction } from 'express';
import { PlanService } from '@/services/planService';
import { createError } from '@/middleware/errorHandler';

/**
 * Middleware to check if center can access attendance features
 */
export const requireAttendanceAccess = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user?.centerId) {
      res.status(400).json({
        success: false,
        message: 'Center information required',
        errors: ['User center information not found'],
      });
      return;
    }

    const center = await PlanService.getCenterPlanStatus(user.centerId);
    const limits = PlanService.getPlanLimits(center.plan as any);

    if (!limits.hasAttendance) {
      res.status(403).json({
        success: false,
        message: 'Feature not available on your current plan',
        errors: ['Attendance features require a Pro plan or higher'],
      });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Plan verification failed',
      errors: ['Unable to verify plan permissions'],
    });
  }
};

/**
 * Middleware to check if center can access events features
 */
export const requireEventsAccess = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user?.centerId) {
      res.status(400).json({
        success: false,
        message: 'Center information required',
        errors: ['User center information not found'],
      });
      return;
    }

    const center = await PlanService.getCenterPlanStatus(user.centerId);
    const limits = PlanService.getPlanLimits(center.plan as any);

    if (!limits.hasEvents) {
      res.status(403).json({
        success: false,
        message: 'Feature not available on your current plan',
        errors: ['Events features require a Pro plan or higher'],
      });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Plan verification failed',
      errors: ['Unable to verify plan permissions'],
    });
  }
};

/**
 * Middleware to check if center can access staff management features
 */
export const requireStaffManagementAccess = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user?.centerId) {
      res.status(400).json({
        success: false,
        message: 'Center information required',
        errors: ['User center information not found'],
      });
      return;
    }

    const center = await PlanService.getCenterPlanStatus(user.centerId);
    const limits = PlanService.getPlanLimits(center.plan as any);

    if (!limits.hasStaffManagement) {
      res.status(403).json({
        success: false,
        message: 'Feature not available on your current plan',
        errors: ['Staff management requires a Pro plan or higher'],
      });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Plan verification failed',
      errors: ['Unable to verify plan permissions'],
    });
  }
};

/**
 * Middleware to check student count limits before creation
 */
export const checkStudentLimit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user?.centerId) {
      res.status(400).json({
        success: false,
        message: 'Center information required',
        errors: ['User center information not found'],
      });
      return;
    }

    // Get current student count
    const prisma = (await import('@/config/database')).default;
    const studentCount = await prisma.student.count({
      where: { centerId: user.centerId },
    });

    const canAddStudent = await PlanService.checkPlanLimit(user.centerId, 'students', studentCount);

    if (!canAddStudent) {
      const center = await PlanService.getCenterPlanStatus(user.centerId);
      const limits = PlanService.getPlanLimits(center.plan as any);

      res.status(403).json({
        success: false,
        message: `You reached ${limits.maxStudents} students. Please upgrade to a higher plan to add more.`,
        errors: [`Your ${center.plan} plan allows up to ${limits.maxStudents} students. Please upgrade to a higher plan to add more students.`],
      });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Limit verification failed',
      errors: ['Unable to verify student limits'],
    });
  }
};
