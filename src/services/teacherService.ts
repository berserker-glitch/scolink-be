import { prisma } from '@/config/database';
import { CreateTeacherInput, UpdateTeacherInput, TeacherResponse, TeacherWithGroupsResponse } from '@/types/teacher';
import { PaginationQuery } from '@/types/common';
import { createError } from '@/utils/errorHandler';
import { logger } from '@/utils/logger';
import bcrypt from 'bcrypt';
import { emailService } from '@/utils/email';
import { PlanService } from '@/services/planService';

export class TeacherService {
  static async createTeacher(centerId: string, teacherData: CreateTeacherInput): Promise<TeacherResponse> {
    // Check if center exists
    const center = await prisma.center.findUnique({
      where: { id: centerId },
    });

    if (!center) {
      throw createError('Center not found', 404);
    }

    // Check if teacher with same email already exists in this center
    const existingTeacher = await prisma.teacher.findFirst({
      where: { 
        email: teacherData.email,
        centerId,
      },
    });

    if (existingTeacher) {
      throw createError('Teacher with this email already exists', 409);
    }

    const teacher = await prisma.teacher.create({
      data: {
        ...teacherData,
        centerId,
      },
      include: {
        _count: {
          select: { groups: true },
        },
      },
    });

    logger.info('Teacher created successfully', { teacherId: teacher.id, name: teacher.name });

    return {
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone || undefined,
      bio: teacher.bio || undefined,
      centerId: teacher.centerId,
      isActive: teacher.isActive,
      createdAt: teacher.createdAt,
      updatedAt: teacher.updatedAt,
      groupsCount: teacher._count.groups,
    };
  }

  static async getTeacherById(id: string, centerId: string): Promise<TeacherResponse> {
    const teacher = await prisma.teacher.findFirst({
      where: { 
        id,
        centerId 
      },
      include: {
        _count: {
          select: { groups: true },
        },
        groups: {
          select: {
            subject: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!teacher) {
      throw createError('Teacher not found', 404);
    }

    // Get unique subjects taught by this teacher
    const subjects = Array.from(new Set(teacher.groups.map(group => group.subject.name)));

    return {
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone || undefined,
      bio: teacher.bio || undefined,
      centerId: teacher.centerId,
      isActive: teacher.isActive,
      createdAt: teacher.createdAt,
      updatedAt: teacher.updatedAt,
      groupsCount: teacher._count.groups,
      subjects,
    };
  }

  static async getTeacherWithGroups(id: string, centerId: string): Promise<TeacherWithGroupsResponse> {
    const teacher = await prisma.teacher.findFirst({
      where: {
        id,
        centerId
      },
      include: {
        groups: {
          select: {
            id: true,
            name: true,
            capacity: true,
            classNumber: true,
            subject: {
              select: { id: true, name: true },
            },
            schedules: {
              select: {
                day: true,
                startTime: true,
                endTime: true,
              },
            },
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!teacher) {
      // Check if there's a user with this ID and teacher role
      const user = await prisma.user.findFirst({
        where: {
          id,
          centerId,
          role: 'teacher' as any
        }
      });

      if (user) {
        // User exists as teacher but no teacher record - return empty profile
        return {
          id: user.id,
          name: user.fullName,
          email: user.email,
          phone: user.phoneNumber || undefined,
          bio: undefined,
          centerId: user.centerId!,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          groupsCount: 0,
          subjects: [],
          groups: []
        };
      }

      throw createError('Teacher not found', 404);
    }

    // Get unique subjects taught by this teacher
    const subjects = Array.from(new Set(teacher.groups.map(group => group.subject.name)));

    return {
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone || undefined,
      bio: teacher.bio || undefined,
      centerId: teacher.centerId,
      isActive: teacher.isActive,
      createdAt: teacher.createdAt,
      updatedAt: teacher.updatedAt,
      groupsCount: teacher.groups.length,
      subjects,
      groups: await Promise.all(teacher.groups.map(async (group) => ({
        id: group.id,
        name: group.name,
        subjectId: group.subject.id,
        subjectName: group.subject.name,
        capacity: group.capacity,
        classNumber: group.classNumber,
        studentCount: await prisma.studentEnrollment.count({
          where: { groupId: group.id }
        }),
        schedules: group.schedules.map(schedule => ({
          day: schedule.day,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
        })),
      }))),
    };
  }

  static async updateTeacher(id: string, centerId: string, teacherData: UpdateTeacherInput): Promise<TeacherResponse> {
    const teacher = await prisma.teacher.findFirst({
      where: { 
        id,
        centerId 
      },
    });

    if (!teacher) {
      throw createError('Teacher not found', 404);
    }

    // Check if email is being changed and if it already exists
    if (teacherData.email && teacherData.email !== teacher.email) {
      const existingTeacher = await prisma.teacher.findFirst({
        where: { 
          email: teacherData.email,
          centerId,
          id: { not: id },
        },
      });

      if (existingTeacher) {
        throw createError('Teacher with this email already exists', 409);
      }
    }

    const updatedTeacher = await prisma.teacher.update({
      where: { id },
      data: teacherData,
      include: {
        _count: {
          select: { groups: true },
        },
        groups: {
          select: {
            subject: {
              select: { name: true },
            },
          },
        },
      },
    });

    logger.info('Teacher updated successfully', { teacherId: id, changes: teacherData });

    // Get unique subjects taught by this teacher
    const subjects = Array.from(new Set(updatedTeacher.groups.map(group => group.subject.name)));

    return {
      id: updatedTeacher.id,
      name: updatedTeacher.name,
      email: updatedTeacher.email,
      phone: updatedTeacher.phone || undefined,
      bio: updatedTeacher.bio || undefined,
      centerId: updatedTeacher.centerId,
      isActive: updatedTeacher.isActive,
      createdAt: updatedTeacher.createdAt,
      updatedAt: updatedTeacher.updatedAt,
      groupsCount: updatedTeacher._count.groups,
      subjects,
    };
  }

  static async deleteTeacher(id: string, centerId: string): Promise<void> {
    const teacher = await prisma.teacher.findFirst({
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

    if (!teacher) {
      throw createError('Teacher not found', 404);
    }

    // Check if teacher has assigned groups
    if (teacher._count.groups > 0) {
      throw createError('Cannot delete teacher with assigned groups. Please reassign groups first.', 400);
    }

    await prisma.teacher.delete({
      where: { id },
    });

    logger.info('Teacher deleted successfully', { teacherId: id });
  }

  static async getTeachers(centerId: string, pagination: PaginationQuery): Promise<{
    teachers: TeacherResponse[];
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
          { email: { contains: search } },
        ],
      }),
    };

    const [teachers, total] = await Promise.all([
      prisma.teacher.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: { groups: true },
          },
          groups: {
            select: {
              subject: {
                select: { name: true },
              },
            },
          },
        },
      }),
      prisma.teacher.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      teachers: teachers.map(teacher => {
        // Get unique subjects taught by this teacher
        const subjects = Array.from(new Set(teacher.groups.map(group => group.subject.name)));
        
        return {
          id: teacher.id,
          name: teacher.name,
          email: teacher.email,
          phone: teacher.phone || undefined,
          bio: teacher.bio || undefined,
          centerId: teacher.centerId,
          isActive: teacher.isActive,
          createdAt: teacher.createdAt,
          updatedAt: teacher.updatedAt,
          groupsCount: teacher._count.groups,
          subjects,
        };
      }),
      total,
      page,
      limit,
      totalPages,
    };
  }

  static async activateTeacherAccount(teacherId: string, centerId: string): Promise<{ password: string }> {
    // Check if teacher exists and belongs to the center
    const teacher = await prisma.teacher.findFirst({
      where: {
        id: teacherId,
        centerId,
      },
    });

    if (!teacher) {
      throw createError('Teacher not found', 404);
    }

    // Check if center has premium or lifetime plan (required for teacher accounts)
    const centerPlan = await PlanService.getCenterPlanStatus(centerId);
    if (centerPlan.plan !== 'premium' && centerPlan.plan !== 'lifetime') {
      throw createError('Teacher accounts are only available for Premium and Lifetime plans', 403);
    }

    // Check if teacher already has a user account
    const existingUser = await prisma.user.findFirst({
      where: {
        email: teacher.email,
        centerId,
      },
    });

    if (existingUser) {
      throw createError('Teacher already has an active account', 409);
    }

    // Generate a random password
    const password = Math.random().toString(36).slice(-12) + 'A1!';
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user account
    await prisma.user.create({
      data: {
        email: teacher.email,
        passwordHash: hashedPassword,
        fullName: teacher.name,
        role: 'teacher' as any,
        centerId,
        phoneNumber: teacher.phone,
        isActive: true,
      },
    });

    // Send welcome email with login credentials
    try {
      await emailService.sendTeacherWelcomeEmail(teacher.email, teacher.name, password);
    } catch (emailError) {
      logger.error('Failed to send teacher welcome email', { teacherId, email: teacher.email, error: emailError });
      // Don't fail the activation if email fails
    }

    logger.info('Teacher account activated successfully', { teacherId, email: teacher.email });

    return { password };
  }
}
