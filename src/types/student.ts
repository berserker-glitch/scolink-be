import { z } from 'zod';

export const createStudentSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(100, 'Last name too long'),
  sex: z.enum(['M', 'F'], { required_error: 'Sex is required' }),
  yearId: z.string().uuid('Invalid year ID'),
  fieldId: z.string().uuid('Invalid field ID'),
  phone: z.string().min(1, 'Phone is required').max(20, 'Phone too long'),
  parentPhone: z.string().min(1, 'Parent phone is required').max(20, 'Parent phone too long'),
  parentType: z.enum(['Mother', 'Father', 'Guardian'], { required_error: 'Parent type is required' }),
  tag: z.enum(['normal', 'ss']).default('normal'),
  cni: z.string().max(50, 'CNI too long').optional(),
  isActive: z.boolean().optional().default(true),
});

export const updateStudentSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100, 'First name too long').optional(),
  lastName: z.string().min(1, 'Last name is required').max(100, 'Last name too long').optional(),
  sex: z.enum(['M', 'F']).optional(),
  yearId: z.string().uuid('Invalid year ID').optional(),
  fieldId: z.string().uuid('Invalid field ID').optional(),
  phone: z.string().min(1, 'Phone is required').max(20, 'Phone too long').optional(),
  parentPhone: z.string().min(1, 'Parent phone is required').max(20, 'Parent phone too long').optional(),
  parentType: z.enum(['Mother', 'Father', 'Guardian']).optional(),
  tag: z.enum(['normal', 'ss']).optional(),
  cni: z.string().max(50, 'CNI too long').optional(),
  isActive: z.boolean().optional(),
});

export const enrollStudentSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  groupId: z.string().uuid('Invalid group ID'),
});

export type CreateStudentRequest = z.infer<typeof createStudentSchema>;
export type UpdateStudentRequest = z.infer<typeof updateStudentSchema>;
export type EnrollStudentRequest = z.infer<typeof enrollStudentSchema>;

export interface StudentResponse {
  id: string;
  firstName: string;
  lastName: string;
  sex: string;
  yearId: string;
  fieldId: string;
  phone: string;
  parentPhone: string;
  parentType: string;
  tag: string;
  cni?: string;
  centerId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  yearName?: string;
  fieldName?: string;
  enrollments?: Array<{
    id: string;
    groupId: string;
    groupName?: string;
    subjectName?: string;
  }>;
}

export interface StudentListResponse {
  students: StudentResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
