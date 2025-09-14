import { prisma } from '@/config/database';
import { CreateGroupInput, UpdateGroupInput, GroupResponse, GroupWithDetailsResponse } from '@/types/group';
import { PaginationQuery } from '@/types/common';
import { createError } from '@/utils/errorHandler';
import { logger } from '@/utils/logger';

export class GroupService {
  static async createGroup(centerId: string, groupData: CreateGroupInput): Promise<GroupResponse> {
    // Check if center exists
    const center = await prisma.center.findUnique({
      where: { id: centerId },
    });

    if (!center) {
      throw createError('Center not found', 404);
    }

    // Check if subject exists and belongs to this center
    const subject = await prisma.subject.findFirst({
      where: { 
        id: groupData.subjectId,
        centerId 
      },
    });

    if (!subject) {
      throw createError('Subject not found or does not belong to this center', 404);
    }

    // Check if teacher exists and belongs to this center (if provided)
    if (groupData.teacherId) {
      const teacher = await prisma.teacher.findFirst({
        where: { 
          id: groupData.teacherId,
          centerId 
        },
      });

      if (!teacher) {
        throw createError('Teacher not found or does not belong to this center', 404);
      }
    }


    // Use transaction to create group with schedules
    const result = await prisma.$transaction(async (tx) => {
      const group = await tx.group.create({
        data: {
          name: groupData.name,
          capacity: groupData.capacity,
          classNumber: groupData.classNumber,
          subjectId: groupData.subjectId,
          teacherId: groupData.teacherId,
          centerId,
          isActive: groupData.isActive,
        },
      });

      // Create schedules
      const schedules = await tx.groupSchedule.createMany({
        data: groupData.schedules.map(schedule => ({
          groupId: group.id,
          day: schedule.day,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
        })),
      });

      return { group, schedules };
    });

    // Fetch the created group with all relations
    const createdGroup = await prisma.group.findUnique({
      where: { id: result.group.id },
      include: {
        subject: {
          select: { name: true },
        },
        teacher: {
          select: { name: true },
        },
        schedules: {
          select: {
            id: true,
            day: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    logger.info('Group created successfully', { groupId: result.group.id, name: result.group.name });

    return {
      id: createdGroup!.id,
      name: createdGroup!.name,
      capacity: createdGroup!.capacity,
      classNumber: createdGroup!.classNumber,
      subjectId: createdGroup!.subjectId,
      teacherId: createdGroup!.teacherId || undefined,
      centerId: createdGroup!.centerId,
      isActive: createdGroup!.isActive,
      createdAt: createdGroup!.createdAt,
      updatedAt: createdGroup!.updatedAt,
      subjectName: createdGroup!.subject.name,
      teacherName: createdGroup!.teacher?.name,
      studentCount: 0, // New group has no students yet
      schedules: createdGroup!.schedules.map(schedule => ({
        id: schedule.id,
        day: schedule.day,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
      })),
    };
  }

  static async getGroupById(id: string, centerId: string): Promise<GroupResponse> {
    const group = await prisma.group.findFirst({
      where: { 
        id,
        centerId 
      },
      include: {
        subject: {
          select: { name: true },
        },
        teacher: {
          select: { name: true },
        },
        schedules: {
          select: {
            id: true,
            day: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    if (!group) {
      throw createError('Group not found', 404);
    }

    return {
      id: group.id,
      name: group.name,
      capacity: group.capacity,
      classNumber: group.classNumber,
      subjectId: group.subjectId,
      teacherId: group.teacherId || undefined,
      centerId: group.centerId,
      isActive: group.isActive,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
      subjectName: group.subject.name,
      teacherName: group.teacher?.name,
      studentCount: 0, // Will be calculated separately
      schedules: group.schedules.map(schedule => ({
        id: schedule.id,
        day: schedule.day,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
      })),
    };
  }

  static async getGroupWithDetails(id: string, centerId: string): Promise<GroupWithDetailsResponse> {
    const group = await prisma.group.findFirst({
      where: { 
        id,
        centerId 
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            monthlyFee: true,
          },
        },
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        schedules: {
          select: {
            id: true,
            day: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    if (!group) {
      throw createError('Group not found', 404);
    }

    return {
      id: group.id,
      name: group.name,
      capacity: group.capacity,
      classNumber: group.classNumber,
      subjectId: group.subjectId,
      teacherId: group.teacherId || undefined,
      centerId: group.centerId,
      isActive: group.isActive,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
      subjectName: group.subject.name,
      teacherName: group.teacher?.name,
      studentCount: 0, // Will be calculated separately
      schedules: group.schedules.map(schedule => ({
        id: schedule.id,
        day: schedule.day,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
      })),
      subject: {
        id: group.subject.id,
        name: group.subject.name,
        monthlyFee: Number(group.subject.monthlyFee),
      },
      teacher: group.teacher ? {
        id: group.teacher.id,
        name: group.teacher.name,
        email: group.teacher.email,
      } : undefined,
    };
  }

  static async updateGroup(id: string, centerId: string, groupData: UpdateGroupInput): Promise<GroupResponse> {
    const group = await prisma.group.findFirst({
      where: { 
        id,
        centerId 
      },
    });

    if (!group) {
      throw createError('Group not found', 404);
    }

    // Validate subject if being changed
    if (groupData.subjectId && groupData.subjectId !== group.subjectId) {
      const subject = await prisma.subject.findFirst({
        where: { 
          id: groupData.subjectId,
          centerId 
        },
      });

      if (!subject) {
        throw createError('Subject not found or does not belong to this center', 404);
      }
    }

    // Validate teacher if being changed
    if (groupData.teacherId !== undefined && groupData.teacherId !== group.teacherId) {
      if (groupData.teacherId) {
        const teacher = await prisma.teacher.findFirst({
          where: { 
            id: groupData.teacherId,
            centerId 
          },
        });

        if (!teacher) {
          throw createError('Teacher not found or does not belong to this center', 404);
        }
      }
    }


    // Use transaction to update group and schedules
    const result = await prisma.$transaction(async (tx) => {
      const updatedGroup = await tx.group.update({
        where: { id },
        data: {
          name: groupData.name,
          capacity: groupData.capacity,
          classNumber: groupData.classNumber,
          subjectId: groupData.subjectId,
          teacherId: groupData.teacherId === null ? null : groupData.teacherId,
          isActive: groupData.isActive,
        },
      });

      // Update schedules if provided
      if (groupData.schedules) {
        // Delete existing schedules
        await tx.groupSchedule.deleteMany({
          where: { groupId: id },
        });

        // Create new schedules
        await tx.groupSchedule.createMany({
          data: groupData.schedules.map(schedule => ({
            groupId: id,
            day: schedule.day,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
          })),
        });
      }

      return updatedGroup;
    });

    // Fetch the updated group with all relations
    const updatedGroup = await prisma.group.findUnique({
      where: { id },
      include: {
        subject: {
          select: { name: true },
        },
        teacher: {
          select: { name: true },
        },
        schedules: {
          select: {
            id: true,
            day: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    logger.info('Group updated successfully', { groupId: id, changes: groupData });

    return {
      id: updatedGroup!.id,
      name: updatedGroup!.name,
      capacity: updatedGroup!.capacity,
      classNumber: updatedGroup!.classNumber,
      subjectId: updatedGroup!.subjectId,
      teacherId: updatedGroup!.teacherId || undefined,
      centerId: updatedGroup!.centerId,
      isActive: updatedGroup!.isActive,
      createdAt: updatedGroup!.createdAt,
      updatedAt: updatedGroup!.updatedAt,
      subjectName: updatedGroup!.subject.name,
      teacherName: updatedGroup!.teacher?.name,
      studentCount: await prisma.studentEnrollment.count({
        where: { groupId: updatedGroup!.id }
      }),
      schedules: updatedGroup!.schedules.map(schedule => ({
        id: schedule.id,
        day: schedule.day,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
      })),
    };
  }

  static async deleteGroup(id: string, centerId: string): Promise<void> {
    const group = await prisma.group.findFirst({
      where: { 
        id,
        centerId 
      },
    });

    if (!group) {
      throw createError('Group not found', 404);
    }

    // Use transaction to delete group and its schedules
    await prisma.$transaction(async (tx) => {
      // Delete schedules first
      await tx.groupSchedule.deleteMany({
        where: { groupId: id },
      });

      // Delete group
      await tx.group.delete({
        where: { id },
      });
    });

    logger.info('Group deleted successfully', { groupId: id });
  }

  static async getGroups(centerId: string, pagination: PaginationQuery): Promise<{
    groups: GroupResponse[];
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
          { classNumber: { contains: search } },
          { subject: { name: { contains: search } } },
          { teacher: { name: { contains: search } } },
        ],
      }),
    };

    const [groups, total] = await Promise.all([
      prisma.group.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          subject: {
            select: { name: true },
          },
          teacher: {
            select: { name: true },
          },
          schedules: {
            select: {
              id: true,
              day: true,
              startTime: true,
              endTime: true,
            },
          },
        },
      }),
      prisma.group.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Get student counts for all groups in one query
    const studentCounts = await prisma.studentEnrollment.groupBy({
      by: ['groupId'],
      where: {
        groupId: {
          in: groups.map(g => g.id)
        }
      },
      _count: {
        studentId: true
      }
    });

    const studentCountMap = new Map(
      studentCounts.map(sc => [sc.groupId, sc._count.studentId])
    );

    return {
      groups: groups.map(group => ({
        id: group.id,
        name: group.name,
        capacity: group.capacity,
        classNumber: group.classNumber,
        subjectId: group.subjectId,
        teacherId: group.teacherId || undefined,
        centerId: group.centerId,
        isActive: group.isActive,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
        subjectName: group.subject.name,
        teacherName: group.teacher?.name,
        studentCount: studentCountMap.get(group.id) || 0,
        schedules: group.schedules.map(schedule => ({
          id: schedule.id,
          day: schedule.day,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
        })),
      })),
      total,
      page,
      limit,
      totalPages,
    };
  }

  static async getGroupsBySubject(subjectId: string, centerId: string): Promise<GroupResponse[]> {
    // Verify subject belongs to center
    const subject = await prisma.subject.findFirst({
      where: { 
        id: subjectId,
        centerId 
      },
    });

    if (!subject) {
      throw createError('Subject not found or does not belong to this center', 404);
    }

    const groups = await prisma.group.findMany({
      where: { 
        subjectId,
        centerId 
      },
      orderBy: { name: 'asc' },
      include: {
        subject: {
          select: { name: true },
        },
        teacher: {
          select: { name: true },
        },
        schedules: {
          select: {
            id: true,
            day: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    return groups.map(group => ({
      id: group.id,
      name: group.name,
      capacity: group.capacity,
      classNumber: group.classNumber,
      subjectId: group.subjectId,
      teacherId: group.teacherId || undefined,
      centerId: group.centerId,
      isActive: group.isActive,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
      subjectName: group.subject.name,
      teacherName: group.teacher?.name,
      studentCount: 0, // Will be calculated separately
      schedules: group.schedules.map(schedule => ({
        id: schedule.id,
        day: schedule.day,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
      })),
    }));
  }

  static async getGroupStudents(groupId: string, centerId: string) {
    // Verify group exists and belongs to center
    const group = await prisma.group.findFirst({
      where: { 
        id: groupId,
        centerId 
      },
    });

    if (!group) {
      throw createError('Group not found or does not belong to this center', 404);
    }

    // Get students enrolled in this group
    const enrollments = await prisma.studentEnrollment.findMany({
      where: { 
        groupId,
        student: {
          centerId,
          isActive: true,
        }
      },
      include: {
        student: {
          include: {
            year: {
              select: { name: true },
            },
            field: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: [
        { student: { lastName: 'asc' } },
        { student: { firstName: 'asc' } },
      ],
    });

    return enrollments.map(enrollment => ({
      id: enrollment.student.id,
      firstName: enrollment.student.firstName,
      lastName: enrollment.student.lastName,
      sex: enrollment.student.sex,
      yearId: enrollment.student.yearId,
      fieldId: enrollment.student.fieldId,
      phone: enrollment.student.phone,
      parentPhone: enrollment.student.parentPhone,
      parentType: enrollment.student.parentType,
      tag: enrollment.student.tag,
      cni: enrollment.student.cni,
      centerId: enrollment.student.centerId,
      isActive: enrollment.student.isActive,
      createdAt: enrollment.student.createdAt,
      updatedAt: enrollment.student.updatedAt,
      yearName: enrollment.student.year.name,
      fieldName: enrollment.student.field.name,
    }));
  }
}
