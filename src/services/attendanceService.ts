import { prisma } from '../config/database';
import { createError } from '../utils/errorHandler';
import { DateUtils } from '../utils/dateUtils';

export interface CreateAttendanceInput {
  enrollmentId: string;
  date: string; // YYYY-MM-DD format
  status: 'present' | 'absent' | 'late';
  note?: string;
  recordedBy?: string;
}

export interface UpdateAttendanceInput {
  status?: 'present' | 'absent' | 'late';
  note?: string;
}

export interface AttendanceResponse {
  id: string;
  enrollmentId: string;
  date: string;
  status: string;
  note?: string;
  recordedBy?: string;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface BulkAttendanceInput {
  groupId: string;
  date: string;
  attendanceRecords: Array<{
    studentId: string;
    status: 'present' | 'absent' | 'late';
    note?: string;
  }>;
}

export interface GroupAttendanceStatus {
  studentId: string;
  firstName: string;
  lastName: string;
  currentWeekStatus?: 'present' | 'absent' | 'late';
  hasAttendanceToday: boolean;
  lastAttendanceDate?: string;
}

export interface WeekCycleAttendance {
  groupId: string;
  startDate: string;
  endDate: string;
  attendanceExists: boolean;
  attendanceDate?: string;
  students: GroupAttendanceStatus[];
}

export class AttendanceService {
  static async createAttendanceRecord(data: CreateAttendanceInput): Promise<AttendanceResponse> {
    const record = await prisma.attendanceRecord.create({
      data: {
        enrollmentId: data.enrollmentId,
        date: new Date(data.date),
        status: data.status,
        note: data.note,
        recordedBy: data.recordedBy,
      },
      include: {
        enrollment: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return {
      id: record.id,
      enrollmentId: record.enrollmentId,
      date: record.date.toISOString().split('T')[0],
      status: record.status,
      note: record.note || undefined,
      recordedBy: record.recordedBy || undefined,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      student: record.enrollment.student,
    };
  }

  static async bulkCreateAttendance(data: BulkAttendanceInput, recordedBy?: string): Promise<AttendanceResponse[]> {
    const { groupId, date, attendanceRecords } = data;

    // Get all enrollments for this group
    const enrollments = await prisma.studentEnrollment.findMany({
      where: { groupId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const results: AttendanceResponse[] = [];

    for (const attendanceData of attendanceRecords) {
      const enrollment = enrollments.find(e => e.studentId === attendanceData.studentId);
      if (!enrollment) {
        throw createError(`Student ${attendanceData.studentId} is not enrolled in this group`, 400);
      }

      // Check if attendance already exists for this date
      const existingRecord = await prisma.attendanceRecord.findUnique({
        where: {
          enrollmentId_date: {
            enrollmentId: enrollment.id,
            date: new Date(date),
          },
        },
      });

      let record;
      if (existingRecord) {
        // Update existing record
        record = await prisma.attendanceRecord.update({
          where: { id: existingRecord.id },
          data: {
            status: attendanceData.status,
            note: attendanceData.note,
            recordedBy,
          },
        });
      } else {
        // Create new record
        record = await prisma.attendanceRecord.create({
          data: {
            enrollmentId: enrollment.id,
            date: new Date(date),
            status: attendanceData.status,
            note: attendanceData.note,
            recordedBy,
          },
        });
      }

      results.push({
        id: record.id,
        enrollmentId: record.enrollmentId,
        date: record.date.toISOString().split('T')[0],
        status: record.status,
        note: record.note || undefined,
        recordedBy: record.recordedBy || undefined,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
        student: enrollment.student,
      });
    }

    return results;
  }

  static async getAttendanceByEnrollment(enrollmentId: string, startDate?: string, endDate?: string): Promise<AttendanceResponse[]> {
    const whereClause: any = { enrollmentId };

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date.gte = new Date(startDate);
      if (endDate) whereClause.date.lte = new Date(endDate);
    }

    const records = await prisma.attendanceRecord.findMany({
      where: whereClause,
      include: {
        enrollment: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    return records.map(record => ({
      id: record.id,
      enrollmentId: record.enrollmentId,
      date: record.date.toISOString().split('T')[0],
      status: record.status,
      note: record.note || undefined,
      recordedBy: record.recordedBy || undefined,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      student: record.enrollment.student,
    }));
  }

  static async getAttendanceByGroup(groupId: string, startDate?: string, endDate?: string): Promise<AttendanceResponse[]> {
    const whereClause: any = {
      enrollment: {
        groupId,
      },
    };

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date.gte = new Date(startDate);
      if (endDate) whereClause.date.lte = new Date(endDate);
    }

    const records = await prisma.attendanceRecord.findMany({
      where: whereClause,
      include: {
        enrollment: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: [
        { date: 'desc' },
        { enrollment: { student: { firstName: 'asc' } } },
      ],
    });

    return records.map(record => ({
      id: record.id,
      enrollmentId: record.enrollmentId,
      date: record.date.toISOString().split('T')[0],
      status: record.status,
      note: record.note || undefined,
      recordedBy: record.recordedBy || undefined,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      student: record.enrollment.student,
    }));
  }

  static async getAttendanceByStudent(studentId: string, startDate?: string, endDate?: string): Promise<AttendanceResponse[]> {
    const whereClause: any = {
      enrollment: {
        studentId,
      },
    };

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date.gte = new Date(startDate);
      if (endDate) whereClause.date.lte = new Date(endDate);
    }

    const records = await prisma.attendanceRecord.findMany({
      where: whereClause,
      include: {
        enrollment: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            group: {
              select: {
                id: true,
                name: true,
                subject: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    return records.map(record => ({
      id: record.id,
      enrollmentId: record.enrollmentId,
      date: record.date.toISOString().split('T')[0],
      status: record.status,
      note: record.note || undefined,
      recordedBy: record.recordedBy || undefined,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      student: record.enrollment.student,
    }));
  }

  static async updateAttendanceRecord(id: string, data: UpdateAttendanceInput): Promise<AttendanceResponse> {
    const record = await prisma.attendanceRecord.update({
      where: { id },
      data: {
        status: data.status,
        note: data.note,
      },
      include: {
        enrollment: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return {
      id: record.id,
      enrollmentId: record.enrollmentId,
      date: record.date.toISOString().split('T')[0],
      status: record.status,
      note: record.note || undefined,
      recordedBy: record.recordedBy || undefined,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      student: record.enrollment.student,
    };
  }

  static async deleteAttendanceRecord(id: string): Promise<boolean> {
    await prisma.attendanceRecord.delete({
      where: { id },
    });
    return true;
  }

  static async getAttendanceStats(groupId: string, startDate?: string, endDate?: string) {
    const whereClause: any = {
      enrollment: {
        groupId,
      },
    };

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date.gte = new Date(startDate);
      if (endDate) whereClause.date.lte = new Date(endDate);
    }

    const stats = await prisma.attendanceRecord.groupBy({
      by: ['status'],
      where: whereClause,
      _count: {
        status: true,
      },
    });

    const result = {
      present: 0,
      absent: 0,
      late: 0,
      total: 0,
    };

    stats.forEach(stat => {
      result[stat.status as keyof typeof result] = stat._count.status;
      result.total += stat._count.status;
    });

    const attendanceRate = result.total > 0 ? Math.round((result.present / result.total) * 100) : 0;

    return {
      ...result,
      attendanceRate,
    };
  }

  /**
   * Get current week cycle attendance for a group
   * Returns prefilled attendance status based on existing records
   */
  static async getGroupCurrentWeekAttendance(groupId: string, centerId: string): Promise<WeekCycleAttendance> {
    // Get group with schedules to determine class days
    const group = await prisma.group.findFirst({
      where: { id: groupId, centerId },
      include: {
        schedules: true,
        enrollments: {
          where: {
            student: {
              isActive: true,
            },
          },
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!group) {
      throw createError('Group not found or does not belong to this center', 404);
    }

    if (group.schedules.length === 0) {
      throw createError('Group has no schedules defined', 400);
    }

    // Handle multiple schedule days by using the most recent class day
    const scheduleDays = group.schedules.map(s => s.day);
    const today = DateUtils.getCurrentDayName();
    
    // Find the most appropriate class day for week cycle calculation
    // If today is a class day, use today; otherwise, use the most recent class day
    const todayClassDay = scheduleDays.find(day => day === today);
    const classDayName = todayClassDay || group.schedules[0].day;
    
    const weekCycle = DateUtils.getCurrentWeekCycle(classDayName);
    const mostRecentClassDate = DateUtils.getMostRecentClassDate(classDayName);
    const todayDate = new Date();

    // Check if today is a class day
    const isTodayClassDay = DateUtils.isTodayAClassDay(scheduleDays);

    // Get attendance records for the current week cycle
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        enrollment: {
          groupId,
        },
        date: {
          gte: weekCycle.startDate,
          lt: weekCycle.endDate,
        },
      },
      include: {
        enrollment: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Check if attendance exists for today
    const todayDateString = DateUtils.toISODateString(todayDate);
    const todayAttendanceRecords = attendanceRecords.filter(
      record => DateUtils.toISODateString(record.date) === todayDateString
    );

    // Check if attendance exists for the most recent class date
    const mostRecentClassDateString = DateUtils.toISODateString(mostRecentClassDate);
    const recentClassAttendanceRecords = attendanceRecords.filter(
      record => DateUtils.toISODateString(record.date) === mostRecentClassDateString
    );

    const attendanceExists = isTodayClassDay 
      ? todayAttendanceRecords.length > 0
      : recentClassAttendanceRecords.length > 0;

    const attendanceDate = isTodayClassDay 
      ? (todayAttendanceRecords.length > 0 ? todayDateString : undefined)
      : (recentClassAttendanceRecords.length > 0 ? mostRecentClassDateString : undefined);

    // Build student attendance status
    const students: GroupAttendanceStatus[] = group.enrollments.map(enrollment => {
      const student = enrollment.student;
      
      // Find the most recent attendance record for this student in the current cycle
      const studentRecord = attendanceRecords.find(
        record => record.enrollment.studentId === student.id
      );

      return {
        studentId: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        currentWeekStatus: studentRecord?.status as 'present' | 'absent' | 'late' | undefined,
        hasAttendanceToday: isTodayClassDay && todayAttendanceRecords.some(
          record => record.enrollment.studentId === student.id
        ),
        lastAttendanceDate: studentRecord ? DateUtils.toISODateString(studentRecord.date) : undefined,
      };
    });

    return {
      groupId,
      startDate: DateUtils.toISODateString(weekCycle.startDate),
      endDate: DateUtils.toISODateString(weekCycle.endDate),
      attendanceExists,
      attendanceDate,
      students,
    };
  }

  /**
   * Get attendance for a specific date and group
   */
  static async getGroupAttendanceByDate(groupId: string, date: string, centerId: string): Promise<AttendanceResponse[]> {
    // Verify group belongs to center
    const group = await prisma.group.findFirst({
      where: { id: groupId, centerId },
    });

    if (!group) {
      throw createError('Group not found or does not belong to this center', 404);
    }

    return this.getAttendanceByGroup(groupId, date, date);
  }

  /**
   * Check if today is a class day for a group
   */
  static async isGroupClassToday(groupId: string, centerId: string): Promise<{
    isClassToday: boolean;
    classDays: string[];
    today: string;
  }> {
    const group = await prisma.group.findFirst({
      where: { id: groupId, centerId },
      include: {
        schedules: {
          select: { day: true },
        },
      },
    });

    if (!group) {
      throw createError('Group not found or does not belong to this center', 404);
    }

    const classDays = group.schedules.map(s => s.day);
    const today = DateUtils.getCurrentDayName();
    const isClassToday = DateUtils.isTodayAClassDay(classDays);

    return {
      isClassToday,
      classDays,
      today,
    };
  }
}
