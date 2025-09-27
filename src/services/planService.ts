import { CenterPlan } from '@prisma/client';
import prisma from '@/config/database';
import { logger } from '@/utils/logger';
import { createError } from '@/middleware/errorHandler';

export class PlanService {
  /**
   * Check if a center's plan has expired
   */
  static isPlanExpired(plan: CenterPlan, planExpiresAt: Date | null): boolean {
    // Basic and lifetime plans never expire
    if (plan === 'basic' || plan === 'lifetime') {
      return false;
    }

    // Pro and premium plans expire if planExpiresAt is in the past
    if (!planExpiresAt) {
      return true; // If no expiry date is set for paid plans, consider it expired
    }

    return new Date() > planExpiresAt;
  }

  /**
   * Check if a center's plan is active (not expired)
   */
  static isPlanActive(plan: CenterPlan, planExpiresAt: Date | null): boolean {
    return !this.isPlanExpired(plan, planExpiresAt);
  }

  /**
   * Get plan limits and features
   */
  static getPlanLimits(plan: CenterPlan) {
    const planLimits = {
      basic: {
        maxStudents: 50,
        maxTeachers: 5,
        maxGroups: 10,
        maxSubjects: 15,
        hasAdvancedReports: false,
        hasApiAccess: false,
        hasCustomBranding: false,
        priority: 1
      },
      pro: {
        maxStudents: 200,
        maxTeachers: 20,
        maxGroups: 50,
        maxSubjects: 50,
        hasAdvancedReports: true,
        hasApiAccess: false,
        hasCustomBranding: false,
        priority: 2
      },
      premium: {
        maxStudents: 500,
        maxTeachers: 50,
        maxGroups: 100,
        maxSubjects: 100,
        hasAdvancedReports: true,
        hasApiAccess: true,
        hasCustomBranding: true,
        priority: 3
      },
      lifetime: {
        maxStudents: -1, // Unlimited
        maxTeachers: -1, // Unlimited
        maxGroups: -1, // Unlimited
        maxSubjects: -1, // Unlimited
        hasAdvancedReports: true,
        hasApiAccess: true,
        hasCustomBranding: true,
        priority: 4
      }
    };

    return planLimits[plan];
  }

  /**
   * Upgrade a center's plan
   */
  static async upgradePlan(
    centerId: string, 
    newPlan: CenterPlan,
    durationMonths?: number
  ): Promise<void> {
    const center = await prisma.center.findUnique({
      where: { id: centerId },
    });

    if (!center) {
      throw createError('Center not found', 404);
    }

    let planExpiresAt: Date | null = null;

    // Set expiry date for paid plans
    if (newPlan === 'pro' || newPlan === 'premium') {
      if (!durationMonths) {
        throw createError('Duration in months is required for paid plans', 400);
      }
      planExpiresAt = new Date();
      planExpiresAt.setMonth(planExpiresAt.getMonth() + durationMonths);
    }

    await prisma.center.update({
      where: { id: centerId },
      data: {
        plan: newPlan,
        planExpiresAt,
        planUpgradedAt: new Date(),
      },
    });

    logger.info('Center plan upgraded', {
      centerId,
      oldPlan: center.plan,
      newPlan,
      planExpiresAt,
    });
  }

  /**
   * Update a center's plan (for plan selection)
   */
  static async updateCenterPlan(centerId: string, plan: CenterPlan): Promise<any> {
    const center = await prisma.center.findUnique({
      where: { id: centerId }
    });

    if (!center) {
      throw createError('Center not found', 404);
    }

    // Calculate expiry date for paid plans
    let planExpiresAt: Date | null = null;
    let subscriptionStatus: string | null = null;

    if (plan === 'pro' || plan === 'premium') {
      // For paid plans without Paddle subscription, set a temporary expiry
      planExpiresAt = new Date();
      planExpiresAt.setDate(planExpiresAt.getDate() + 7); // 7 days trial
      subscriptionStatus = 'trial';
    } else if (plan === 'basic') {
      // Basic plan doesn't expire
      subscriptionStatus = null;
    }

    const updatedCenter = await prisma.center.update({
      where: { id: centerId },
      data: {
        plan,
        planExpiresAt,
        planUpgradedAt: new Date(), // Mark when plan was selected
        subscriptionStatus
      }
    });

    logger.info('Center plan updated', {
      centerId,
      plan,
      planExpiresAt,
      subscriptionStatus
    });

    return {
      id: updatedCenter.id,
      name: updatedCenter.name,
      plan: updatedCenter.plan,
      planExpiresAt: updatedCenter.planExpiresAt,
      planUpgradedAt: updatedCenter.planUpgradedAt,
      subscriptionStatus: updatedCenter.subscriptionStatus
    };
  }

  /**
   * Get center plan status
   */
  static async getCenterPlanStatus(centerId: string): Promise<{
    plan: string | null;
    planExpiresAt: string | null;
    subscriptionStatus: string | null;
  }> {
    logger.info('Looking up center for plan status', { centerId });
    
    const center = await prisma.center.findUnique({
      where: { id: centerId }
    });

    if (!center) {
      logger.error('Center not found for plan status', { centerId });
      throw createError('Center not found', 404);
    }

    logger.info('Found center for plan status', {
      centerId,
      centerName: center.name,
      plan: center.plan,
      planUpgradedAt: center.planUpgradedAt
    });

    return {
      plan: center.plan,
      planExpiresAt: center.planExpiresAt?.toISOString() || null,
      subscriptionStatus: center.subscriptionStatus
    };
  }

  /**
   * Downgrade expired paid plans to basic
   */
  static async handleExpiredPlans(): Promise<void> {
    const expiredCenters = await prisma.center.findMany({
      where: {
        plan: { in: ['pro', 'premium'] },
        planExpiresAt: { lte: new Date() },
      },
    });

    for (const center of expiredCenters) {
      await prisma.center.update({
        where: { id: center.id },
        data: {
          plan: 'basic',
          planExpiresAt: null,
          planUpgradedAt: new Date(),
        },
      });

      logger.info('Center plan downgraded due to expiry', {
        centerId: center.id,
        oldPlan: center.plan,
        newPlan: 'basic',
      });
    }

    if (expiredCenters.length > 0) {
      logger.info(`Downgraded ${expiredCenters.length} expired centers to basic plan`);
    }
  }

  /**
   * Get centers with plans expiring soon (within 7 days)
   */
  static async getCentersWithExpiringSoon(): Promise<any[]> {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    return await prisma.center.findMany({
      where: {
        plan: { in: ['pro', 'premium'] },
        planExpiresAt: {
          gte: new Date(),
          lte: sevenDaysFromNow,
        },
      },
      include: {
        admins: {
          select: {
            email: true,
            fullName: true,
          },
        },
      },
    });
  }

  /**
   * Check if center can perform action based on plan limits
   */
  static async checkPlanLimit(
    centerId: string, 
    resource: 'students' | 'teachers' | 'groups' | 'subjects',
    currentCount: number
  ): Promise<boolean> {
    const center = await prisma.center.findUnique({
      where: { id: centerId },
    });

    if (!center) {
      throw createError('Center not found', 404);
    }

    // Check if plan is active
    if (!center.plan || !this.isPlanActive(center.plan, center.planExpiresAt)) {
      // If plan is expired, downgrade to basic
      await prisma.center.update({
        where: { id: centerId },
        data: {
          plan: 'basic',
          planExpiresAt: null,
          planUpgradedAt: new Date(),
        },
      });
      center.plan = 'basic';
    }

    const limits = this.getPlanLimits(center.plan || 'basic');
    const maxLimit = limits[`max${resource.charAt(0).toUpperCase() + resource.slice(1)}` as keyof typeof limits] as number;

    // -1 means unlimited
    if (maxLimit === -1) {
      return true;
    }

    return currentCount < maxLimit;
  }
}
