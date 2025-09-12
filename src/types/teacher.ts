import { z } from 'zod';

// Teacher Creation Schema
export const createTeacherSchema = z.object({
  name: z.string().min(1, 'Teacher name is required').max(100, 'Teacher name too long'),
  email: z.string().email('Invalid email format').max(255, 'Email too long'),
  phone: z.string().max(20, 'Phone number too long').optional(),
  bio: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;

// Teacher Update Schema
export const updateTeacherSchema = z.object({
  name: z.string().min(1, 'Teacher name is required').max(100, 'Teacher name too long').optional(),
  email: z.string().email('Invalid email format').max(255, 'Email too long').optional(),
  phone: z.string().max(20, 'Phone number too long').optional(),
  bio: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateTeacherInput = z.infer<typeof updateTeacherSchema>;

// Teacher Response
export interface TeacherResponse {
  id: string;
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  centerId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  groupsCount?: number;
  subjects?: string[];
}

// Teacher with Groups Response
export interface TeacherWithGroupsResponse extends TeacherResponse {
  groups: {
    id: string;
    name: string;
    subjectName: string;
    capacity: number;
    classNumber: string;
    studentCount: number;
    schedules: {
      day: string;
      startTime: string;
      endTime: string;
    }[];
  }[];
}
