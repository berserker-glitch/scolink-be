import { z } from 'zod';

// Year Creation Schema
export const createYearSchema = z.object({
  name: z.string().min(1, 'Year name is required').max(100, 'Year name too long'),
  order: z.number().int().min(1, 'Order must be at least 1'),
  isActive: z.boolean().optional().default(true),
});

export type CreateYearInput = z.infer<typeof createYearSchema>;

// Year Update Schema
export const updateYearSchema = z.object({
  name: z.string().min(1, 'Year name is required').max(100, 'Year name too long').optional(),
  order: z.number().int().min(1, 'Order must be at least 1').optional(),
  isActive: z.boolean().optional(),
});

export type UpdateYearInput = z.infer<typeof updateYearSchema>;

// Year Response
export interface YearResponse {
  id: string;
  name: string;
  order: number;
  isActive: boolean;
  centerId: string;
  createdAt: Date;
  updatedAt: Date;
  fieldsCount?: number;
}

// Year with Fields Response
export interface YearWithFieldsResponse extends YearResponse {
  fields: {
    id: string;
    name: string;
    isActive: boolean;
    createdAt: Date;
  }[];
}
