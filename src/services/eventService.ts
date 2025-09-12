import { prisma } from '../config/database';
import { createError } from '../utils/errorHandler';
import { logger } from '../utils/logger';
import { 
  CreateEventInput, 
  UpdateEventInput, 
  EventResponse, 
  EventType,
  EventScheduleResponse,
  EventEnrollmentResponse,
  EventGroupResponse 
} from '../types/event';
import { PaginationQuery } from '../types/common';

export class EventService {
  static async createEvent(centerId: string, eventData: CreateEventInput): Promise<EventResponse> {
    // Check if center exists
    const center = await prisma.center.findUnique({
      where: { id: centerId },
    });

    if (!center) {
      throw createError('Center not found', 404);
    }

    // If it's a temp additional course day, verify groups exist and belong to center
    if (eventData.type === EventType.TempAdditionalCourseDay && eventData.groupIds) {
      const groups = await prisma.group.findMany({
        where: { 
          id: { in: eventData.groupIds },
          centerId 
        },
      });

      if (groups.length !== eventData.groupIds.length) {
        throw createError('One or more groups not found or do not belong to this center', 404);
      }
    }

    // Create event with schedules and groups in a transaction
    const event = await prisma.$transaction(async (tx) => {
      const createdEvent = await tx.event.create({
        data: {
          name: eventData.name,
          type: eventData.type as any, // Cast to Prisma enum
          fee: eventData.fee,
          description: eventData.description,
          centerId,
          schedules: {
            create: eventData.schedules.map(schedule => ({
              date: new Date(schedule.date),
              startTime: schedule.startTime,
              endTime: schedule.endTime,
            })),
          },
          ...(eventData.type === EventType.TempAdditionalCourseDay && eventData.groupIds && {
            groups: {
              create: eventData.groupIds.map(groupId => ({
                groupId,
              })),
            },
          }),
        },
        include: {
          schedules: true,
          groups: {
            include: {
              group: {
                include: {
                  subject: { select: { name: true } },
                  teacher: { select: { name: true } },
                },
              },
            },
          },
        },
      });

      // For temp additional course days, auto-enroll all students from selected groups
      if (eventData.type === EventType.TempAdditionalCourseDay && eventData.groupIds) {
        const enrollments = await tx.studentEnrollment.findMany({
          where: {
            groupId: { in: eventData.groupIds },
            student: { isActive: true },
          },
          select: { studentId: true },
        });

        const uniqueStudentIds = [...new Set(enrollments.map(e => e.studentId))];

        if (uniqueStudentIds.length > 0) {
          await tx.eventEnrollment.createMany({
            data: uniqueStudentIds.map(studentId => ({
              eventId: createdEvent.id,
              studentId,
            })),
          });
        }
      }

      return createdEvent;
    });

    return this.formatEventResponse(event);
  }

  static async getEvents(
    centerId: string, 
    pagination: PaginationQuery
  ): Promise<{
    events: EventResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    const whereClause: any = { centerId };

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          schedules: true,
          enrollments: {
            include: {
              student: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  year: { select: { name: true } },
                  field: { select: { name: true } },
                },
              },
            },
          },
          groups: {
            include: {
              group: {
                include: {
                  subject: { select: { name: true } },
                  teacher: { select: { name: true } },
                },
              },
            },
          },
        },
      }),
      prisma.event.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      events: events.map(event => this.formatEventResponse(event)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  static async getEventById(eventId: string, centerId: string): Promise<EventResponse> {
    const event = await prisma.event.findFirst({
      where: { id: eventId, centerId },
      include: {
        schedules: true,
        enrollments: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                year: { select: { name: true } },
                field: { select: { name: true } },
              },
            },
          },
        },
        groups: {
          include: {
            group: {
              include: {
                subject: { select: { name: true } },
                teacher: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    if (!event) {
      throw createError('Event not found or does not belong to this center', 404);
    }

    return this.formatEventResponse(event);
  }

  static async updateEvent(eventId: string, centerId: string, eventData: UpdateEventInput): Promise<EventResponse> {
    // Check if event exists and belongs to center
    const existingEvent = await prisma.event.findFirst({
      where: { id: eventId, centerId },
    });

    if (!existingEvent) {
      throw createError('Event not found or does not belong to this center', 404);
    }

    // If updating groups for temp additional course day, verify groups exist
    if (eventData.groupIds && eventData.type === EventType.TempAdditionalCourseDay) {
      const groups = await prisma.group.findMany({
        where: { 
          id: { in: eventData.groupIds },
          centerId 
        },
      });

      if (groups.length !== eventData.groupIds.length) {
        throw createError('One or more groups not found or do not belong to this center', 404);
      }
    }

    const event = await prisma.$transaction(async (tx) => {
      // Update event
      const updatedEvent = await tx.event.update({
        where: { id: eventId },
        data: {
          name: eventData.name,
          type: eventData.type as any,
          fee: eventData.fee,
          description: eventData.description,
          isActive: eventData.isActive,
        },
      });

      // Update schedules if provided
      if (eventData.schedules) {
        await tx.eventSchedule.deleteMany({
          where: { eventId },
        });

        await tx.eventSchedule.createMany({
          data: eventData.schedules.map(schedule => ({
            eventId,
            date: new Date(schedule.date),
            startTime: schedule.startTime,
            endTime: schedule.endTime,
          })),
        });
      }

      // Update groups if provided (for temp additional course days)
      if (eventData.groupIds !== undefined) {
        await tx.eventGroup.deleteMany({
          where: { eventId },
        });

        if (eventData.groupIds.length > 0) {
          await tx.eventGroup.createMany({
            data: eventData.groupIds.map(groupId => ({
              eventId,
              groupId,
            })),
          });
        }
      }

      return updatedEvent;
    });

    return this.getEventById(eventId, centerId);
  }

  static async deleteEvent(eventId: string, centerId: string): Promise<boolean> {
    const event = await prisma.event.findFirst({
      where: { id: eventId, centerId },
    });

    if (!event) {
      throw createError('Event not found or does not belong to this center', 404);
    }

    await prisma.event.delete({
      where: { id: eventId },
    });

    return true;
  }

  static async enrollStudentInEvent(eventId: string, studentId: string, centerId: string): Promise<boolean> {
    // Verify event belongs to center
    const event = await prisma.event.findFirst({
      where: { id: eventId, centerId },
    });

    if (!event) {
      throw createError('Event not found or does not belong to this center', 404);
    }

    // Verify student belongs to center
    const student = await prisma.student.findFirst({
      where: { id: studentId, centerId },
    });

    if (!student) {
      throw createError('Student not found or does not belong to this center', 404);
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.eventEnrollment.findUnique({
      where: {
        eventId_studentId: {
          eventId,
          studentId,
        },
      },
    });

    if (existingEnrollment) {
      throw createError('Student is already enrolled in this event', 409);
    }

    await prisma.eventEnrollment.create({
      data: {
        eventId,
        studentId,
      },
    });

    return true;
  }

  static async unenrollStudentFromEvent(eventId: string, studentId: string, centerId: string): Promise<boolean> {
    // Verify event belongs to center
    const event = await prisma.event.findFirst({
      where: { id: eventId, centerId },
    });

    if (!event) {
      throw createError('Event not found or does not belong to this center', 404);
    }

    const enrollment = await prisma.eventEnrollment.findUnique({
      where: {
        eventId_studentId: {
          eventId,
          studentId,
        },
      },
    });

    if (!enrollment) {
      throw createError('Student is not enrolled in this event', 404);
    }

    await prisma.eventEnrollment.delete({
      where: {
        eventId_studentId: {
          eventId,
          studentId,
        },
      },
    });

    return true;
  }

  static async bulkEnrollStudentsInEvent(eventId: string, studentIds: string[], centerId: string): Promise<boolean> {
    // Verify event belongs to center
    const event = await prisma.event.findFirst({
      where: { id: eventId, centerId },
    });

    if (!event) {
      throw createError('Event not found or does not belong to this center', 404);
    }

    // Verify all students belong to center
    const students = await prisma.student.findMany({
      where: { 
        id: { in: studentIds },
        centerId 
      },
    });

    if (students.length !== studentIds.length) {
      throw createError('One or more students not found or do not belong to this center', 404);
    }

    // Get existing enrollments to avoid duplicates
    const existingEnrollments = await prisma.eventEnrollment.findMany({
      where: {
        eventId,
        studentId: { in: studentIds },
      },
      select: { studentId: true },
    });

    const existingStudentIds = new Set(existingEnrollments.map(e => e.studentId));
    const newStudentIds = studentIds.filter(id => !existingStudentIds.has(id));

    if (newStudentIds.length > 0) {
      await prisma.eventEnrollment.createMany({
        data: newStudentIds.map(studentId => ({
          eventId,
          studentId,
        })),
      });
    }

    return true;
  }

  private static formatEventResponse(event: any): EventResponse {
    return {
      id: event.id,
      name: event.name,
      type: event.type as EventType,
      fee: event.fee ? parseFloat(event.fee.toString()) : undefined,
      description: event.description,
      centerId: event.centerId,
      isActive: event.isActive,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
      schedules: (event.schedules || []).map((schedule: any): EventScheduleResponse => ({
        id: schedule.id,
        eventId: schedule.eventId,
        date: schedule.date.toISOString().split('T')[0],
        startTime: schedule.startTime,
        endTime: schedule.endTime,
      })),
      enrollments: (event.enrollments || []).map((enrollment: any): EventEnrollmentResponse => ({
        id: enrollment.id,
        eventId: enrollment.eventId,
        studentId: enrollment.studentId,
        student: enrollment.student ? {
          id: enrollment.student.id,
          firstName: enrollment.student.firstName,
          lastName: enrollment.student.lastName,
          yearName: enrollment.student.year?.name,
          fieldName: enrollment.student.field?.name,
        } : undefined,
      })),
      groups: (event.groups || []).map((eventGroup: any): EventGroupResponse => ({
        id: eventGroup.id,
        eventId: eventGroup.eventId,
        groupId: eventGroup.groupId,
        group: eventGroup.group ? {
          id: eventGroup.group.id,
          name: eventGroup.group.name,
          subjectName: eventGroup.group.subject?.name,
          teacherName: eventGroup.group.teacher?.name,
        } : undefined,
      })),
      enrolledStudentsCount: (event.enrollments || []).length,
    };
  }
}
