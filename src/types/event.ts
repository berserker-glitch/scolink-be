import { z } from 'zod';

export enum EventType {
  Normal = 'Normal',
  TempAdditionalCourseDay = 'TempAdditionalCourseDay'
}

export interface EventResponse {
  id: string;
  name: string;
  type: EventType;
  fee?: number;
  description?: string;
  centerId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  schedules: EventScheduleResponse[];
  enrollments?: EventEnrollmentResponse[];
  groups?: EventGroupResponse[];
  enrolledStudentsCount?: number;
}

export interface EventScheduleResponse {
  id: string;
  eventId: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface EventEnrollmentResponse {
  id: string;
  eventId: string;
  studentId: string;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    yearName?: string;
    fieldName?: string;
  };
}

export interface EventGroupResponse {
  id: string;
  eventId: string;
  groupId: string;
  group?: {
    id: string;
    name: string;
    subjectName?: string;
    teacherName?: string;
  };
}

export interface CreateEventInput {
  name: string;
  type: EventType;
  fee?: number;
  description?: string;
  schedules: Array<{
    date: string; // YYYY-MM-DD format
    startTime: string; // HH:MM format
    endTime: string; // HH:MM format
  }>;
  groupIds?: string[]; // For temp additional course days
}

export interface UpdateEventInput {
  name?: string;
  type?: EventType;
  fee?: number;
  description?: string;
  schedules?: Array<{
    date: string;
    startTime: string;
    endTime: string;
  }>;
  groupIds?: string[];
  isActive?: boolean;
}

// Zod validation schemas
export const eventScheduleSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be in HH:MM format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'End time must be in HH:MM format'),
});

export const createEventSchema = z.object({
  name: z.string().min(1, 'Event name is required').max(255),
  type: z.nativeEnum(EventType),
  fee: z.number().min(0).optional(),
  description: z.string().optional(),
  schedules: z.array(eventScheduleSchema).min(1, 'At least one schedule is required'),
  groupIds: z.array(z.string().uuid()).optional(),
}).refine((data) => {
  // Fee is required for Normal events
  if (data.type === EventType.Normal && (data.fee === undefined || data.fee === null)) {
    return false;
  }
  // GroupIds are required for TempAdditionalCourseDay events
  if (data.type === EventType.TempAdditionalCourseDay && (!data.groupIds || data.groupIds.length === 0)) {
    return false;
  }
  return true;
}, {
  message: 'Fee is required for Normal events and groupIds are required for Temp Additional Course Day events',
});

export const updateEventSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  type: z.nativeEnum(EventType).optional(),
  fee: z.number().min(0).optional(),
  description: z.string().optional(),
  schedules: z.array(eventScheduleSchema).optional(),
  groupIds: z.array(z.string().uuid()).optional(),
  isActive: z.boolean().optional(),
});

export const enrollStudentInEventSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
});

export const enrollStudentsInEventSchema = z.object({
  studentIds: z.array(z.string().uuid()).min(1, 'At least one student ID is required'),
});
