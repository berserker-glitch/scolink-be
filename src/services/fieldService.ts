import { prisma } from '@/config/database';
import { CreateFieldInput, UpdateFieldInput, FieldResponse } from '@/types/field';
import { PaginationQuery } from '@/types/common';
import { createError } from '@/utils/errorHandler';
import { logger } from '@/utils/logger';

export class FieldService {
  static async createField(centerId: string, fieldData: CreateFieldInput): Promise<FieldResponse> {
    // Check if center exists
    const center = await prisma.center.findUnique({
      where: { id: centerId },
    });

    if (!center) {
      throw createError('Center not found', 404);
    }

    // Check if year exists and belongs to this center
    const year = await prisma.year.findFirst({
      where: { 
        id: fieldData.yearId,
        centerId 
      },
    });

    if (!year) {
      throw createError('Year not found or does not belong to this center', 404);
    }

    // Check if field with same name already exists in this year
    const existingField = await prisma.field.findFirst({
      where: { 
        yearId: fieldData.yearId,
        name: fieldData.name,
        centerId,
      },
    });

    if (existingField) {
      throw createError('Field with this name already exists in this year', 409);
    }

    const field = await prisma.field.create({
      data: {
        ...fieldData,
        centerId,
      },
    });

    logger.info('Field created successfully', { fieldId: field.id, name: field.name, yearId: fieldData.yearId });

    return {
      id: field.id,
      name: field.name,
      yearId: field.yearId,
      centerId: field.centerId,
      isActive: field.isActive,
      createdAt: field.createdAt,
      updatedAt: field.updatedAt,
      yearName: year.name,
    };
  }

  static async getFieldById(id: string, centerId: string): Promise<FieldResponse> {
    const field = await prisma.field.findFirst({
      where: { 
        id,
        centerId 
      },
      include: {
        year: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!field) {
      throw createError('Field not found', 404);
    }

    return {
      id: field.id,
      name: field.name,
      yearId: field.yearId,
      centerId: field.centerId,
      isActive: field.isActive,
      createdAt: field.createdAt,
      updatedAt: field.updatedAt,
      yearName: field.year.name,
    };
  }

  static async updateField(id: string, centerId: string, fieldData: UpdateFieldInput): Promise<FieldResponse> {
    const field = await prisma.field.findFirst({
      where: { 
        id,
        centerId 
      },
    });

    if (!field) {
      throw createError('Field not found', 404);
    }

    // If yearId is being changed, check if the new year exists and belongs to this center
    if (fieldData.yearId && fieldData.yearId !== field.yearId) {
      const year = await prisma.year.findFirst({
        where: { 
          id: fieldData.yearId,
          centerId 
        },
      });

      if (!year) {
        throw createError('Year not found or does not belong to this center', 404);
      }
    }

    // Check if name is being changed and if it already exists in the target year
    if (fieldData.name && (fieldData.name !== field.name || fieldData.yearId)) {
      const targetYearId = fieldData.yearId || field.yearId;
      const existingField = await prisma.field.findFirst({
        where: { 
          yearId: targetYearId,
          name: fieldData.name,
          centerId,
          id: { not: id },
        },
      });

      if (existingField) {
        throw createError('Field with this name already exists in this year', 409);
      }
    }

    const updatedField = await prisma.field.update({
      where: { id },
      data: fieldData,
      include: {
        year: {
          select: {
            name: true,
          },
        },
      },
    });

    logger.info('Field updated successfully', { fieldId: id, changes: fieldData });

    return {
      id: updatedField.id,
      name: updatedField.name,
      yearId: updatedField.yearId,
      centerId: updatedField.centerId,
      isActive: updatedField.isActive,
      createdAt: updatedField.createdAt,
      updatedAt: updatedField.updatedAt,
      yearName: updatedField.year.name,
    };
  }

  static async deleteField(id: string, centerId: string): Promise<void> {
    const field = await prisma.field.findFirst({
      where: { 
        id,
        centerId 
      },
    });

    if (!field) {
      throw createError('Field not found', 404);
    }

    await prisma.field.delete({
      where: { id },
    });

    logger.info('Field deleted successfully', { fieldId: id });
  }

  static async getFields(centerId: string, pagination: PaginationQuery): Promise<{
    fields: FieldResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, search, sortBy = 'name', sortOrder = 'asc' } = pagination;
    const skip = (page - 1) * limit;

    const where = {
      centerId,
      ...(search && {
        OR: [
          { name: { contains: search } },
          { year: { name: { contains: search } } },
        ],
      }),
    };

    const [fields, total] = await Promise.all([
      prisma.field.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          year: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.field.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      fields: fields.map(field => ({
        id: field.id,
        name: field.name,
        yearId: field.yearId,
        centerId: field.centerId,
        isActive: field.isActive,
        createdAt: field.createdAt,
        updatedAt: field.updatedAt,
        yearName: field.year.name,
      })),
      total,
      page,
      limit,
      totalPages,
    };
  }

  static async getFieldsByYear(yearId: string, centerId: string): Promise<FieldResponse[]> {
    // Verify year belongs to center
    const year = await prisma.year.findFirst({
      where: { 
        id: yearId,
        centerId 
      },
    });

    if (!year) {
      throw createError('Year not found or does not belong to this center', 404);
    }

    const fields = await prisma.field.findMany({
      where: { 
        yearId,
        centerId 
      },
      orderBy: { name: 'asc' },
      include: {
        year: {
          select: {
            name: true,
          },
        },
      },
    });

    return fields.map(field => ({
      id: field.id,
      name: field.name,
      yearId: field.yearId,
      centerId: field.centerId,
      isActive: field.isActive,
      createdAt: field.createdAt,
      updatedAt: field.updatedAt,
      yearName: field.year.name,
    }));
  }
}
