import { User, UserRole } from '@prisma/client';
import prisma from '@/config/database';
import { hashPassword } from '@/utils/password';
import { logger } from '@/utils/logger';
import { createError } from '@/middleware/errorHandler';
import { CreateUserInput, UpdateUserInput, UserResponse } from '@/types/user';
import { PaginationQuery } from '@/types/common';

export class UserService {
  static async createUser(userData: CreateUserInput): Promise<UserResponse> {
    const { email, password, fullName, phoneNumber, role, centerId } = userData;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw createError('User with this email already exists', 409);
    }

    // Validate center exists if centerId is provided
    if (centerId) {
      const center = await prisma.center.findUnique({
        where: { id: centerId },
      });

      if (!center) {
        throw createError('Center not found', 404);
      }
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        phoneNumber,
        role,
        centerId,
      },
    });

    logger.info('User created successfully', { userId: user.id, email: user.email, role: user.role });

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber || undefined,
      role: user.role,
      centerId: user.centerId || undefined,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  static async getUserById(id: string): Promise<UserResponse> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { center: true },
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber || undefined,
      role: user.role,
      centerId: user.centerId || undefined,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  static async updateUser(id: string, userData: UpdateUserInput): Promise<UserResponse> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    // Check if email is being changed and if it already exists
    if (userData.email && userData.email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existingUser) {
        throw createError('User with this email already exists', 409);
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: userData,
    });

    logger.info('User updated successfully', { userId: id, changes: userData });

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      fullName: updatedUser.fullName,
      phoneNumber: updatedUser.phoneNumber || undefined,
      role: updatedUser.role,
      centerId: updatedUser.centerId || undefined,
      isActive: updatedUser.isActive,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };
  }

  static async deleteUser(id: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    // Soft delete by setting isActive to false
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    logger.info('User deleted successfully', { userId: id });
  }

  static async suspendUser(id: string): Promise<UserResponse> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    // Super admin cannot be suspended
    if (user.role === 'super_admin') {
      throw createError('Cannot suspend super admin user', 403);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    logger.info('User suspended successfully', { userId: id });

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      fullName: updatedUser.fullName,
      role: updatedUser.role as any,
      isActive: updatedUser.isActive,
      phoneNumber: updatedUser.phoneNumber || undefined,
      centerId: updatedUser.centerId || undefined,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };
  }

  static async unsuspendUser(id: string): Promise<UserResponse> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: true },
    });

    logger.info('User unsuspended successfully', { userId: id });

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      fullName: updatedUser.fullName,
      role: updatedUser.role as any,
      isActive: updatedUser.isActive,
      phoneNumber: updatedUser.phoneNumber || undefined,
      centerId: updatedUser.centerId || undefined,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };
  }

  static async getUsers(pagination: PaginationQuery): Promise<{
    users: UserResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { email: { contains: search } },
            { fullName: { contains: search } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { center: true },
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber || undefined,
        role: user.role,
        centerId: user.centerId || undefined,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
      total,
      page,
      limit,
      totalPages,
    };
  }

  static async getCenterAdmins(centerId: string, pagination: PaginationQuery): Promise<{
    admins: UserResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    const where = {
      centerId,
      role: UserRole.center_admin,
      ...(search && {
        OR: [
          { email: { contains: search } },
          { fullName: { contains: search } },
        ],
      }),
    };

    const [admins, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      admins: admins.map(admin => ({
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        phoneNumber: admin.phoneNumber || undefined,
        role: admin.role,
        centerId: admin.centerId || undefined,
        isActive: admin.isActive,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
      })),
      total,
      page,
      limit,
      totalPages,
    };
  }
}
