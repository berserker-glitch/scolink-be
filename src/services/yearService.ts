import { prisma } from '@/config/database';
import { CreateYearInput, UpdateYearInput, YearResponse, YearWithFieldsResponse } from '@/types/year';
import { PaginationQuery } from '@/types/common';
import { createError } from '@/utils/errorHandler';
import { logger } from '@/utils/logger';

export class YearService {
  static async createYear(centerId: string, yearData: CreateYearInput): Promise<YearResponse> {
    // Check if center exists
    const center = await prisma.center.findUnique({
      where: { id: centerId },
    });

    if (!center) {
      throw createError('Center not found', 404);
    }

    // Check if year with same order already exists in this center
    const existingYear = await prisma.year.findFirst({
      where: { 
        centerId,
        order: yearData.order 
      },
    });

    if (existingYear) {
      throw createError('Year with this order already exists', 409);
    }

    const year = await prisma.year.create({
      data: {
        ...yearData,
        centerId,
      },
    });

    logger.info('Year created successfully', { yearId: year.id, name: year.name, centerId });

    return {
      id: year.id,
      name: year.name,
      order: year.order,
      isActive: year.isActive,
      centerId: year.centerId,
      createdAt: year.createdAt,
      updatedAt: year.updatedAt,
    };
  }

  static async getYearById(id: string, centerId: string): Promise<YearResponse> {
    const year = await prisma.year.findFirst({
      where: { 
        id,
        centerId 
      },
      include: {
        _count: {
          select: { fields: true },
        },
      },
    });

    if (!year) {
      throw createError('Year not found', 404);
    }

    return {
      id: year.id,
      name: year.name,
      order: year.order,
      isActive: year.isActive,
      centerId: year.centerId,
      createdAt: year.createdAt,
      updatedAt: year.updatedAt,
      fieldsCount: year._count.fields,
    };
  }

  static async getYearWithFields(id: string, centerId: string): Promise<YearWithFieldsResponse> {
    const year = await prisma.year.findFirst({
      where: { 
        id,
        centerId 
      },
      include: {
        fields: {
          select: {
            id: true,
            name: true,
            isActive: true,
            createdAt: true,
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!year) {
      throw createError('Year not found', 404);
    }

    return {
      id: year.id,
      name: year.name,
      order: year.order,
      isActive: year.isActive,
      centerId: year.centerId,
      createdAt: year.createdAt,
      updatedAt: year.updatedAt,
      fields: year.fields,
    };
  }

  static async updateYear(id: string, centerId: string, yearData: UpdateYearInput): Promise<YearResponse> {
    const year = await prisma.year.findFirst({
      where: { 
        id,
        centerId 
      },
    });

    if (!year) {
      throw createError('Year not found', 404);
    }

    // Check if order is being changed and if it already exists
    if (yearData.order && yearData.order !== year.order) {
      const existingYear = await prisma.year.findFirst({
        where: { 
          centerId,
          order: yearData.order,
          id: { not: id },
        },
      });

      if (existingYear) {
        throw createError('Year with this order already exists', 409);
      }
    }

    const updatedYear = await prisma.year.update({
      where: { id },
      data: yearData,
    });

    logger.info('Year updated successfully', { yearId: id, changes: yearData });

    return {
      id: updatedYear.id,
      name: updatedYear.name,
      order: updatedYear.order,
      isActive: updatedYear.isActive,
      centerId: updatedYear.centerId,
      createdAt: updatedYear.createdAt,
      updatedAt: updatedYear.updatedAt,
    };
  }

  static async deleteYear(id: string, centerId: string): Promise<void> {
    const year = await prisma.year.findFirst({
      where: { 
        id,
        centerId 
      },
      include: {
        _count: {
          select: { fields: true },
        },
      },
    });

    if (!year) {
      throw createError('Year not found', 404);
    }

    // Check if year has fields
    if (year._count.fields > 0) {
      throw createError('Cannot delete year with existing fields', 400);
    }

    await prisma.year.delete({
      where: { id },
    });

    logger.info('Year deleted successfully', { yearId: id });
  }

  static async deleteYearWithFields(id: string, centerId: string): Promise<void> {
    const year = await prisma.year.findFirst({
      where: { 
        id,
        centerId 
      },
      include: {
        fields: true,
      },
    });

    if (!year) {
      throw createError('Year not found', 404);
    }

    // Use transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // First delete all fields
      if (year.fields.length > 0) {
        await tx.field.deleteMany({
          where: {
            yearId: id,
          },
        });
      }

      // Then delete the year
      await tx.year.delete({
        where: { id },
      });
    });

    logger.info('Year and associated fields deleted successfully', { yearId: id });
  }

  static async getYears(centerId: string, pagination: PaginationQuery): Promise<{
    years: YearResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, search, sortBy = 'order', sortOrder = 'asc' } = pagination;
    const skip = (page - 1) * limit;

    const where = {
      centerId,
      ...(search && {
        name: { contains: search },
      }),
    };

    const [years, total] = await Promise.all([
      prisma.year.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: { fields: true },
          },
        },
      }),
      prisma.year.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      years: years.map(year => ({
        id: year.id,
        name: year.name,
        order: year.order,
        isActive: year.isActive,
        centerId: year.centerId,
        createdAt: year.createdAt,
        updatedAt: year.updatedAt,
        fieldsCount: year._count.fields,
      })),
      total,
      page,
      limit,
      totalPages,
    };
  }
}
