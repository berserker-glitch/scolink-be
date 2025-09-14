import { prisma } from '@/config/database';
import { CreateSubjectInput, UpdateSubjectInput, SubjectResponse, SubjectWithGroupsResponse } from '@/types/subject';
import { PaginationQuery } from '@/types/common';
import { createError } from '@/utils/errorHandler';
import { logger } from '@/utils/logger';

export class SubjectService {
  static async createSubject(centerId: string, subjectData: CreateSubjectInput): Promise<SubjectResponse> {
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
        id: subjectData.yearId,
        centerId 
      },
    });

    if (!year) {
      throw createError('Year not found or does not belong to this center', 404);
    }

    // Check if field exists and belongs to this center
    const field = await prisma.field.findFirst({
      where: { 
        id: subjectData.fieldId,
        centerId 
      },
    });

    if (!field) {
      throw createError('Field not found or does not belong to this center', 404);
    }


    const subject = await prisma.subject.create({
      data: {
        ...subjectData,
        centerId,
      },
      include: {
        year: {
          select: { name: true },
        },
        field: {
          select: { name: true },
        },
        _count: {
          select: { groups: true },
        },
      },
    });

    logger.info('Subject created successfully', { subjectId: subject.id, name: subject.name });

    return {
      id: subject.id,
      name: subject.name,
      monthlyFee: Number(subject.monthlyFee),
      yearId: subject.yearId,
      fieldId: subject.fieldId,
      centerId: subject.centerId,
      isActive: subject.isActive,
      createdAt: subject.createdAt,
      updatedAt: subject.updatedAt,
      yearName: subject.year.name,
      fieldName: subject.field.name,
      groupsCount: subject._count.groups,
    };
  }

  static async getSubjectById(id: string, centerId: string): Promise<SubjectResponse> {
    const subject = await prisma.subject.findFirst({
      where: { 
        id,
        centerId 
      },
      include: {
        year: {
          select: { name: true },
        },
        field: {
          select: { name: true },
        },
        _count: {
          select: { groups: true },
        },
      },
    });

    if (!subject) {
      throw createError('Subject not found', 404);
    }

    return {
      id: subject.id,
      name: subject.name,
      monthlyFee: Number(subject.monthlyFee),
      yearId: subject.yearId,
      fieldId: subject.fieldId,
      centerId: subject.centerId,
      isActive: subject.isActive,
      createdAt: subject.createdAt,
      updatedAt: subject.updatedAt,
      yearName: subject.year.name,
      fieldName: subject.field.name,
      groupsCount: subject._count.groups,
    };
  }

  static async getSubjectWithGroups(id: string, centerId: string): Promise<SubjectWithGroupsResponse> {
    const subject = await prisma.subject.findFirst({
      where: { 
        id,
        centerId 
      },
      include: {
        year: {
          select: { name: true },
        },
        field: {
          select: { name: true },
        },
        groups: {
          select: {
            id: true,
            name: true,
            capacity: true,
            classNumber: true,
            isActive: true,
            teacher: {
              select: { name: true },
            },
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!subject) {
      throw createError('Subject not found', 404);
    }

    return {
      id: subject.id,
      name: subject.name,
      monthlyFee: Number(subject.monthlyFee),
      yearId: subject.yearId,
      fieldId: subject.fieldId,
      centerId: subject.centerId,
      isActive: subject.isActive,
      createdAt: subject.createdAt,
      updatedAt: subject.updatedAt,
      yearName: subject.year.name,
      fieldName: subject.field.name,
      groupsCount: subject.groups.length,
      groups: await Promise.all(subject.groups.map(async (group) => ({
        id: group.id,
        name: group.name,
        capacity: group.capacity,
        classNumber: group.classNumber,
        isActive: group.isActive,
        teacherName: group.teacher?.name,
        studentCount: await prisma.studentEnrollment.count({
          where: { groupId: group.id }
        })
      }))),
    };
  }

  static async updateSubject(id: string, centerId: string, subjectData: UpdateSubjectInput): Promise<SubjectResponse> {
    const subject = await prisma.subject.findFirst({
      where: { 
        id,
        centerId 
      },
    });

    if (!subject) {
      throw createError('Subject not found', 404);
    }

    // If yearId or fieldId is being changed, validate they belong to this center
    if (subjectData.yearId) {
      const year = await prisma.year.findFirst({
        where: { 
          id: subjectData.yearId,
          centerId 
        },
      });

      if (!year) {
        throw createError('Year not found or does not belong to this center', 404);
      }
    }

    if (subjectData.fieldId) {
      const field = await prisma.field.findFirst({
        where: { 
          id: subjectData.fieldId,
          centerId 
        },
      });

      if (!field) {
        throw createError('Field not found or does not belong to this center', 404);
      }
    }


    const updatedSubject = await prisma.subject.update({
      where: { id },
      data: subjectData,
      include: {
        year: {
          select: { name: true },
        },
        field: {
          select: { name: true },
        },
        _count: {
          select: { groups: true },
        },
      },
    });

    logger.info('Subject updated successfully', { subjectId: id, changes: subjectData });

    return {
      id: updatedSubject.id,
      name: updatedSubject.name,
      monthlyFee: Number(updatedSubject.monthlyFee),
      yearId: updatedSubject.yearId,
      fieldId: updatedSubject.fieldId,
      centerId: updatedSubject.centerId,
      isActive: updatedSubject.isActive,
      createdAt: updatedSubject.createdAt,
      updatedAt: updatedSubject.updatedAt,
      yearName: updatedSubject.year.name,
      fieldName: updatedSubject.field.name,
      groupsCount: updatedSubject._count.groups,
    };
  }

  static async deleteSubject(id: string, centerId: string): Promise<void> {
    const subject = await prisma.subject.findFirst({
      where: { 
        id,
        centerId 
      },
      include: {
        _count: {
          select: { groups: true },
        },
      },
    });

    if (!subject) {
      throw createError('Subject not found', 404);
    }

    // Check if subject has groups
    if (subject._count.groups > 0) {
      throw createError('Cannot delete subject with existing groups', 400);
    }

    await prisma.subject.delete({
      where: { id },
    });

    logger.info('Subject deleted successfully', { subjectId: id });
  }

  static async deleteSubjectWithGroups(id: string, centerId: string): Promise<void> {
    const subject = await prisma.subject.findFirst({
      where: { 
        id,
        centerId 
      },
      include: {
        groups: true,
      },
    });

    if (!subject) {
      throw createError('Subject not found', 404);
    }

    // Use transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // First delete all group schedules
      for (const group of subject.groups) {
        await tx.groupSchedule.deleteMany({
          where: { groupId: group.id },
        });
      }

      // Then delete all groups
      if (subject.groups.length > 0) {
        await tx.group.deleteMany({
          where: { subjectId: id },
        });
      }

      // Finally delete the subject
      await tx.subject.delete({
        where: { id },
      });
    });

    logger.info('Subject and associated groups deleted successfully', { subjectId: id });
  }

  static async getSubjects(centerId: string, pagination: PaginationQuery): Promise<{
    subjects: SubjectResponse[];
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
          { field: { name: { contains: search } } },
        ],
      }),
    };

    const [subjects, total] = await Promise.all([
      prisma.subject.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          year: {
            select: { name: true },
          },
          field: {
            select: { name: true },
          },
          _count: {
            select: { groups: true },
          },
        },
      }),
      prisma.subject.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      subjects: subjects.map(subject => ({
        id: subject.id,
        name: subject.name,
        monthlyFee: Number(subject.monthlyFee),
        yearId: subject.yearId,
        fieldId: subject.fieldId,
        centerId: subject.centerId,
        isActive: subject.isActive,
        createdAt: subject.createdAt,
        updatedAt: subject.updatedAt,
        yearName: subject.year.name,
        fieldName: subject.field.name,
        groupsCount: subject._count.groups,
      })),
      total,
      page,
      limit,
      totalPages,
    };
  }

  static async getSubjectsByField(fieldId: string, centerId: string): Promise<SubjectResponse[]> {
    // Verify field belongs to center
    const field = await prisma.field.findFirst({
      where: { 
        id: fieldId,
        centerId 
      },
    });

    if (!field) {
      throw createError('Field not found or does not belong to this center', 404);
    }

    const subjects = await prisma.subject.findMany({
      where: { 
        fieldId,
        centerId 
      },
      orderBy: { name: 'asc' },
      include: {
        year: {
          select: { name: true },
        },
        field: {
          select: { name: true },
        },
        _count: {
          select: { groups: true },
        },
      },
    });

    return subjects.map(subject => ({
      id: subject.id,
      name: subject.name,
      monthlyFee: Number(subject.monthlyFee),
      yearId: subject.yearId,
      fieldId: subject.fieldId,
      centerId: subject.centerId,
      isActive: subject.isActive,
      createdAt: subject.createdAt,
      updatedAt: subject.updatedAt,
      yearName: subject.year.name,
      fieldName: subject.field.name,
      groupsCount: subject._count.groups,
    }));
  }
}
