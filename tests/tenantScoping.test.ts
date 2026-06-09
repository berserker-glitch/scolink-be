import { UserRole } from '@prisma/client';

const mockPrisma = {
  center: {
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
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
jest.mock('@/utils/password', () => ({
  hashPassword: jest.fn(),
  verifyPassword: jest.fn(),
}));

import { CenterService } from '@/services/centerService';
import { UserService } from '@/services/userService';

describe('tenant scoping', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('scopes center-admin center lists to their own center', async () => {
    mockPrisma.center.findMany.mockResolvedValue([]);
    mockPrisma.center.count.mockResolvedValue(0);

    await CenterService.getCenters(
      { page: 1, limit: 10 },
      { role: UserRole.center_admin, centerId: 'center-1' }
    );

    expect(mockPrisma.center.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'center-1' },
    }));
    expect(mockPrisma.center.count).toHaveBeenCalledWith({ where: { id: 'center-1' } });
  });

  it('hides other centers from center admins', async () => {
    await expect(
      CenterService.getCenterById('center-2', { role: UserRole.center_admin, centerId: 'center-1' })
    ).rejects.toMatchObject({ statusCode: 404 });

    expect(mockPrisma.center.findUnique).not.toHaveBeenCalled();
  });

  it('scopes center-admin user lists to their own center', async () => {
    mockPrisma.user.findMany.mockResolvedValue([]);
    mockPrisma.user.count.mockResolvedValue(0);

    await UserService.getUsers(
      { page: 1, limit: 10 },
      { role: UserRole.center_admin, centerId: 'center-1' }
    );

    expect(mockPrisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { centerId: 'center-1' },
    }));
    expect(mockPrisma.user.count).toHaveBeenCalledWith({ where: { centerId: 'center-1' } });
  });

  it('hides users from other centers', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-2',
      email: 'user@example.com',
      fullName: 'User',
      role: UserRole.center_admin,
      centerId: 'center-2',
      isActive: true,
      phoneNumber: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      UserService.getUserById('user-2', { role: UserRole.center_admin, centerId: 'center-1' })
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
