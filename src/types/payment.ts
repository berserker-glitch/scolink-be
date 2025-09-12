import { z } from 'zod';

// Payment interfaces
export interface Payment {
  id: string;
  studentId: string;
  month: string; // Format: YYYY-MM
  amount: number;
  paidAmount?: number;
  status: 'paid' | 'partial' | 'pending' | 'overdue';
  paymentDate?: string;
  dueDate: string;
  method?: 'cash' | 'transfer' | 'check' | 'other';
  note?: string;
  subjects: {
    subjectId: string;
    amount: number;
  }[];
  recordedBy: string;
  centerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentRequest {
  studentId: string;
  month: string;
  subjects: {
    subjectId: string;
    amount: number;
  }[];
  amount: number;
  paidAmount?: number;
  paymentDate?: string;
  method?: 'cash' | 'transfer' | 'check' | 'other';
  note?: string;
}

export interface UpdatePaymentRequest {
  amount?: number;
  paidAmount?: number;
  status?: 'paid' | 'partial' | 'pending' | 'overdue';
  paymentDate?: string;
  method?: 'cash' | 'transfer' | 'check' | 'other';
  note?: string;
}

export interface PaymentSummary {
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  paymentCount: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
}

export interface MonthlyPaymentStatus {
  month: string;
  studentId: string;
  totalAmount: number;
  paidAmount: number;
  status: 'paid' | 'partial' | 'pending' | 'overdue';
  dueDate: string;
  subjects: {
    subjectId: string;
    subjectName: string;
    amount: number;
    paid: boolean;
  }[];
}

// Zod schemas for validation
export const createPaymentSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Invalid month format. Use YYYY-MM'),
  subjects: z.array(z.object({
    subjectId: z.string().uuid('Invalid subject ID'),
    amount: z.number().positive('Amount must be positive')
  })).min(1, 'At least one subject is required'),
  amount: z.number().positive('Total amount must be positive'),
  paidAmount: z.number().nonnegative('Paid amount cannot be negative').optional(),
  paymentDate: z.string().datetime().optional(),
  method: z.enum(['cash', 'transfer', 'check', 'other']).optional(),
  note: z.string().max(500, 'Note cannot exceed 500 characters').optional()
});

export const updatePaymentSchema = z.object({
  amount: z.number().positive('Amount must be positive').optional(),
  paidAmount: z.number().nonnegative('Paid amount cannot be negative').optional(),
  status: z.enum(['paid', 'partial', 'pending', 'overdue']).optional(),
  paymentDate: z.string().datetime().optional(),
  method: z.enum(['cash', 'transfer', 'check', 'other']).optional(),
  note: z.string().max(500, 'Note cannot exceed 500 characters').optional()
});

export const bulkUpdatePaymentSchema = z.object({
  paymentIds: z.array(z.string().uuid()).min(1, 'At least one payment ID is required'),
  updates: updatePaymentSchema
});

export const paymentQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  studentId: z.string().uuid().optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  status: z.enum(['paid', 'partial', 'pending', 'overdue']).optional(),
  yearMonth: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  search: z.string().max(100).optional()
});
