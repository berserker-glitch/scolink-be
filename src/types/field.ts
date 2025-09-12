import { z } from 'zod';

// Field Creation Schema
export const createFieldSchema = z.object({
  name: z.string().min(1, 'Field name is required').max(100, 'Field name too long'),
  yearId: z.string().uuid('Invalid year ID'),
  isActive: z.boolean().optional().default(true),
});

export type CreateFieldInput = z.infer<typeof createFieldSchema>;

// Field Update Schema
export const updateFieldSchema = z.object({
  name: z.string().min(1, 'Field name is required').max(100, 'Field name too long').optional(),
  yearId: z.string().uuid('Invalid year ID').optional(),
  isActive: z.boolean().optional(),
});

export type UpdateFieldInput = z.infer<typeof updateFieldSchema>;

// Field Response
export interface FieldResponse {
  id: string;
  name: string;
  yearId: string;
  centerId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  yearName?: string;
}
