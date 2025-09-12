import { z } from 'zod';

// Subject Creation Schema
export const createSubjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required').max(100, 'Subject name too long'),
  monthlyFee: z.number().min(0, 'Monthly fee must be positive'),
  yearId: z.string().uuid('Invalid year ID'),
  fieldId: z.string().uuid('Invalid field ID'),
  isActive: z.boolean().optional().default(true),
});

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;

// Subject Update Schema
export const updateSubjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required').max(100, 'Subject name too long').optional(),
  monthlyFee: z.number().min(0, 'Monthly fee must be positive').optional(),
  yearId: z.string().uuid('Invalid year ID').optional(),
  fieldId: z.string().uuid('Invalid field ID').optional(),
  isActive: z.boolean().optional(),
});

export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;

// Subject Response
export interface SubjectResponse {
  id: string;
  name: string;
  monthlyFee: number;
  yearId: string;
  fieldId: string;
  centerId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  yearName?: string;
  fieldName?: string;
  groupsCount?: number;
}

// Subject with Groups Response
export interface SubjectWithGroupsResponse extends SubjectResponse {
  groups: {
    id: string;
    name: string;
    capacity: number;
    classNumber: string;
    isActive: boolean;
    teacherName?: string;
    studentCount: number;
  }[];
}
