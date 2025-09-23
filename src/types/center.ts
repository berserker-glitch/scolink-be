import { z } from 'zod';
import { CenterPlan } from '@prisma/client';

// Center Creation Schema
export const createCenterSchema = z.object({
  name: z.string().min(2, 'Center name must be at least 2 characters'),
  location: z.string().min(5, 'Location must be at least 5 characters'),
  phoneNumber: z.string().optional(),
  email: z.string().email('Invalid email format').optional(),
});

export type CreateCenterInput = z.infer<typeof createCenterSchema>;

// Center Update Schema
export const updateCenterSchema = z.object({
  name: z.string().min(2, 'Center name must be at least 2 characters').optional(),
  location: z.string().min(5, 'Location must be at least 5 characters').optional(),
  phoneNumber: z.string().optional(),
  email: z.string().email('Invalid email format').optional(),
});

export type UpdateCenterInput = z.infer<typeof updateCenterSchema>;

// Center Response
export interface CenterResponse {
  id: string;
  name: string;
  location: string;
  phoneNumber?: string;
  email?: string;
  plan: CenterPlan;
  planExpiresAt?: Date;
  planUpgradedAt?: Date;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  adminCount?: number;
}

// Center with Admins Response
export interface CenterWithAdminsResponse extends CenterResponse {
  admins: {
    id: string;
    email: string;
    fullName: string;
    phoneNumber?: string;
    isActive: boolean;
    createdAt: Date;
  }[];
}
