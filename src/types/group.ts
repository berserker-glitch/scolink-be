import { z } from 'zod';

// Group Schedule Schema
export const groupScheduleSchema = z.object({
  day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
});

export type GroupScheduleInput = z.infer<typeof groupScheduleSchema>;

// Group Creation Schema
export const createGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(100, 'Group name too long'),
  capacity: z.number().min(1, 'Capacity must be at least 1').max(100, 'Capacity too large'),
  classNumber: z.string().min(1, 'Class number is required').max(50, 'Class number too long'),
  subjectId: z.string().uuid('Invalid subject ID'),
  teacherId: z.string().uuid('Invalid teacher ID').optional(),
  schedules: z.array(groupScheduleSchema).min(1, 'At least one schedule is required'),
  isActive: z.boolean().optional().default(true),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;

// Group Update Schema
export const updateGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(100, 'Group name too long').optional(),
  capacity: z.number().min(1, 'Capacity must be at least 1').max(100, 'Capacity too large').optional(),
  classNumber: z.string().min(1, 'Class number is required').max(50, 'Class number too long').optional(),
  subjectId: z.string().uuid('Invalid subject ID').optional(),
  teacherId: z.string().uuid('Invalid teacher ID').optional().nullable(),
  schedules: z.array(groupScheduleSchema).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;

// Group Response
export interface GroupResponse {
  id: string;
  name: string;
  capacity: number;
  classNumber: string;
  subjectId: string;
  teacherId?: string;
  centerId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  subjectName?: string;
  teacherName?: string;
  studentCount?: number;
  schedules: {
    id: string;
    day: string;
    startTime: string;
    endTime: string;
  }[];
}

// Group with Details Response
export interface GroupWithDetailsResponse extends GroupResponse {
  subject: {
    id: string;
    name: string;
    monthlyFee: number;
  };
  teacher?: {
    id: string;
    name: string;
    email: string;
  };
}
