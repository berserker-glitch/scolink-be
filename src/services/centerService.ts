import { Center } from '@prisma/client';
import prisma from '@/config/database';
import { logger } from '@/utils/logger';
import { createError } from '@/middleware/errorHandler';
import { CreateCenterInput, UpdateCenterInput, CenterResponse, CenterWithAdminsResponse } from '@/types/center';
import { PaginationQuery } from '@/types/common';

export class CenterService {
  static async createCenter(centerData: CreateCenterInput, createdBy: string): Promise<CenterResponse> {
    const { name, location, phoneNumber, email } = centerData;

    // Check if center with same name already exists
    const existingCenter = await prisma.center.findFirst({
      where: { name },
    });

    if (existingCenter) {
      throw createError('Center with this name already exists', 409);
    }

    // Create center
    const center = await prisma.center.create({
      data: {
        name,
        location,
        phoneNumber,
        email,
        createdBy,
      },
    });

    logger.info('Center created successfully', { centerId: center.id, name: center.name, createdBy });

    return {
      id: center.id,
      name: center.name,
      location: center.location,
      phoneNumber: center.phoneNumber || undefined,
      email: center.email || undefined,
      isActive: center.isActive,
      createdBy: center.createdBy,
      createdAt: center.createdAt,
      updatedAt: center.updatedAt,
    };
  }

  static async getCenterById(id: string): Promise<CenterResponse> {
    const center = await prisma.center.findUnique({
      where: { id },
      include: {
        _count: {
          select: { admins: true },
        },
      },
    });

    if (!center) {
      throw createError('Center not found', 404);
    }

    return {
      id: center.id,
      name: center.name,
      location: center.location,
      phoneNumber: center.phoneNumber || undefined,
      email: center.email || undefined,
      isActive: center.isActive,
      createdBy: center.createdBy,
      createdAt: center.createdAt,
      updatedAt: center.updatedAt,
      adminCount: center._count.admins,
    };
  }

  static async getCenterWithAdmins(id: string): Promise<CenterWithAdminsResponse> {
    const center = await prisma.center.findUnique({
      where: { id },
      include: {
        admins: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phoneNumber: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
    });

    if (!center) {
      throw createError('Center not found', 404);
    }

    return {
      id: center.id,
      name: center.name,
      location: center.location,
      phoneNumber: center.phoneNumber || undefined,
      email: center.email || undefined,
      isActive: center.isActive,
      createdBy: center.createdBy,
      createdAt: center.createdAt,
      updatedAt: center.updatedAt,
      admins: center.admins.map(admin => ({
        ...admin,
        phoneNumber: admin.phoneNumber || undefined,
      })),
    };
  }

  static async updateCenter(id: string, centerData: UpdateCenterInput): Promise<CenterResponse> {
    const center = await prisma.center.findUnique({
      where: { id },
    });

    if (!center) {
      throw createError('Center not found', 404);
    }

    // Check if name is being changed and if it already exists
    if (centerData.name && centerData.name !== center.name) {
      const existingCenter = await prisma.center.findFirst({
        where: { name: centerData.name },
      });

      if (existingCenter) {
        throw createError('Center with this name already exists', 409);
      }
    }

    const updatedCenter = await prisma.center.update({
      where: { id },
      data: centerData,
    });

    logger.info('Center updated successfully', { centerId: id, changes: centerData });

    return {
      id: updatedCenter.id,
      name: updatedCenter.name,
      location: updatedCenter.location,
      phoneNumber: updatedCenter.phoneNumber || undefined,
      email: updatedCenter.email || undefined,
      isActive: updatedCenter.isActive,
      createdBy: updatedCenter.createdBy,
      createdAt: updatedCenter.createdAt,
      updatedAt: updatedCenter.updatedAt,
    };
  }

  static async deleteCenter(id: string): Promise<void> {
    const center = await prisma.center.findUnique({
      where: { id },
      include: {
        _count: {
          select: { admins: true },
        },
      },
    });

    if (!center) {
      throw createError('Center not found', 404);
    }

    // Check if center has admins
    if (center._count.admins > 0) {
      throw createError('Cannot delete center with existing admins', 400);
    }

    await prisma.center.delete({
      where: { id },
    });

    logger.info('Center deleted successfully', { centerId: id });
  }

  static async deleteCenterWithAdmins(id: string): Promise<void> {
    const center = await prisma.center.findUnique({
      where: { id },
      include: {
        admins: true,
      },
    });

    if (!center) {
      throw createError('Center not found', 404);
    }

    // Use transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // First delete all center admin users
      if (center.admins.length > 0) {
        await tx.user.deleteMany({
          where: {
            centerId: id,
            role: 'center_admin',
          },
        });
      }

      // Then delete the center
      await tx.center.delete({
        where: { id },
      });
    });

    logger.info('Center and associated admins deleted successfully', { centerId: id });
  }

  static async suspendCenter(id: string): Promise<CenterResponse> {
    const center = await prisma.center.findUnique({
      where: { id },
      include: {
        admins: true,
      },
    });

    if (!center) {
      throw createError('Center not found', 404);
    }

    // Use transaction to suspend center and all its admins
    const result = await prisma.$transaction(async (tx) => {
      // Suspend the center
      const updatedCenter = await tx.center.update({
        where: { id },
        data: { isActive: false },
      });

      // Suspend all center admin users
      if (center.admins.length > 0) {
        await tx.user.updateMany({
          where: {
            centerId: id,
            role: 'center_admin',
          },
          data: { isActive: false },
        });
      }

      return updatedCenter;
    });

    logger.info('Center suspended successfully', { centerId: id });

    return {
      id: result.id,
      name: result.name,
      location: result.location,
      phoneNumber: result.phoneNumber || undefined,
      email: result.email || undefined,
      isActive: result.isActive,
      createdBy: result.createdBy,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  }

  static async unsuspendCenter(id: string): Promise<CenterResponse> {
    const center = await prisma.center.findUnique({
      where: { id },
      include: {
        admins: true,
      },
    });

    if (!center) {
      throw createError('Center not found', 404);
    }

    // Use transaction to unsuspend center and all its admins
    const result = await prisma.$transaction(async (tx) => {
      // Unsuspend the center
      const updatedCenter = await tx.center.update({
        where: { id },
        data: { isActive: true },
      });

      // Unsuspend all center admin users
      if (center.admins.length > 0) {
        await tx.user.updateMany({
          where: {
            centerId: id,
            role: 'center_admin',
          },
          data: { isActive: true },
        });
      }

      return updatedCenter;
    });

    logger.info('Center unsuspended successfully', { centerId: id });

    return {
      id: result.id,
      name: result.name,
      location: result.location,
      phoneNumber: result.phoneNumber || undefined,
      email: result.email || undefined,
      isActive: result.isActive,
      createdBy: result.createdBy,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  }

  static async getCenters(pagination: PaginationQuery): Promise<{
    centers: CenterResponse[];
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
            { name: { contains: search } },
            { location: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : {};

    const [centers, total] = await Promise.all([
      prisma.center.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: { admins: true },
          },
        },
      }),
      prisma.center.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      centers: centers.map(center => ({
        id: center.id,
        name: center.name,
        location: center.location,
        phoneNumber: center.phoneNumber || undefined,
        email: center.email || undefined,
        isActive: center.isActive,
        createdBy: center.createdBy,
        createdAt: center.createdAt,
        updatedAt: center.updatedAt,
        adminCount: center._count.admins,
      })),
      total,
      page,
      limit,
      totalPages,
    };
  }
}
