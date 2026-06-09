const mockPrisma = {
  center: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

jest.mock('@/config/database', () => mockPrisma);
jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import { PlanService } from '@/services/planService';

describe('PlanService.updateCenterPlan', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects center self-service paid plan upgrades', async () => {
    await expect(PlanService.updateCenterPlan('center-1', 'pro' as any)).rejects.toMatchObject({
      statusCode: 403,
    });

    expect(mockPrisma.center.findUnique).not.toHaveBeenCalled();
    expect(mockPrisma.center.update).not.toHaveBeenCalled();
  });

  it('allows center self-service downgrade to basic', async () => {
    const now = new Date();
    mockPrisma.center.findUnique.mockResolvedValue({ id: 'center-1' });
    mockPrisma.center.update.mockResolvedValue({
      id: 'center-1',
      name: 'Center',
      plan: 'basic',
      planExpiresAt: null,
      planUpgradedAt: now,
      subscriptionStatus: null,
    });

    const result = await PlanService.updateCenterPlan('center-1', 'basic');

    expect(mockPrisma.center.update).toHaveBeenCalledWith({
      where: { id: 'center-1' },
      data: {
        plan: 'basic',
        planExpiresAt: null,
        planUpgradedAt: expect.any(Date),
        subscriptionStatus: null,
      },
    });
    expect(result.plan).toBe('basic');
  });
});
