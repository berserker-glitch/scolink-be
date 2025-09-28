import { z } from 'zod';
import { UserRole } from '@prisma/client';

// User Creation Schema
export const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phoneNumber: z.string().optional(),
  role: z.nativeEnum(UserRole),
  centerId: z.string().uuid().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

// User Update Schema
export const updateUserSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
  phoneNumber: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// Profile Update Schema
export const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
  phoneNumber: z.string().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// User Response
export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  role: UserRole;
  centerId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Center Admin Creation Schema
export const createCenterAdminSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phoneNumber: z.string().optional(),
});

export type CreateCenterAdminInput = z.infer<typeof createCenterAdminSchema>;

export const createStaffSchema = z.object({
  email: z.string().email('Invalid email format'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;