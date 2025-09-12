import { Request, Response } from 'express';
import { PaymentService } from '../services/paymentService';
import { handleError } from '../utils/errorHandler';
import { AuthRequest } from '../types/auth';
import { 
  CreatePaymentRequest, 
  UpdatePaymentRequest 
} from '../types/payment';

// Create a new payment record
export const createPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const paymentData: CreatePaymentRequest = req.body;
    const recordedBy = req.user?.userId!;
    const centerId = req.user?.centerId!;

    const payment = await PaymentService.createPayment(paymentData, recordedBy, centerId);

    res.status(201).json({
      success: true,
      data: payment,
      message: 'Payment record created successfully'
    });
  } catch (error) {
    const errorInfo = handleError(error as Error);
    res.status(errorInfo.statusCode).json({
      success: false,
      message: errorInfo.message,
    });
  }
};

// Get payments with filtering and pagination
export const getPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const centerId = req.user?.centerId!;
    const filters = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      studentId: req.query.studentId as string,
      month: req.query.month as string,
      status: req.query.status as string,
      search: req.query.search as string
    };

    const result = await PaymentService.getPayments(centerId, filters);

    res.json({
      success: true,
      data: result.payments,
      pagination: result.pagination,
      message: 'Payments retrieved successfully'
    });
  } catch (error) {
    const errorInfo = handleError(error as Error);
    res.status(errorInfo.statusCode).json({
      success: false,
      message: errorInfo.message
    });
  }
};

// Get payment by ID
export const getPaymentById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { paymentId } = req.params;
    const centerId = req.user?.centerId!;

    const payment = await PaymentService.getPaymentById(paymentId, centerId);

    if (!payment) {
      res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
      return;
    }

    res.json({
      success: true,
      data: payment,
      message: 'Payment retrieved successfully'
    });
  } catch (error) {
    const errorInfo = handleError(error as Error);
    res.status(errorInfo.statusCode).json({
      success: false,
      message: errorInfo.message
    });
  }
};

// Update payment
export const updatePayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { paymentId } = req.params;
    const updateData: UpdatePaymentRequest = req.body;
    const centerId = req.user?.centerId!;

    const payment = await PaymentService.updatePayment(paymentId, updateData, centerId);

    if (!payment) {
      res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
      return;
    }

    res.json({
      success: true,
      data: payment,
      message: 'Payment updated successfully'
    });
  } catch (error) {
    const errorInfo = handleError(error as Error);
    res.status(errorInfo.statusCode).json({
      success: false,
      message: errorInfo.message
    });
  }
};

// Delete payment
export const deletePayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { paymentId } = req.params;
    const centerId = req.user?.centerId!;

    const deleted = await PaymentService.deletePayment(paymentId, centerId);

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Payment deleted successfully'
    });
  } catch (error) {
    const errorInfo = handleError(error as Error);
    res.status(errorInfo.statusCode).json({
      success: false,
      message: errorInfo.message
    });
  }
};

// Get student payments
export const getStudentPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const centerId = req.user?.centerId!;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    const payments = await PaymentService.getStudentPayments(studentId, centerId, limit);

    res.json({
      success: true,
      data: payments,
      message: 'Student payments retrieved successfully'
    });
  } catch (error) {
    const errorInfo = handleError(error as Error);
    res.status(errorInfo.statusCode).json({
      success: false,
      message: errorInfo.message
    });
  }
};

// Get student monthly payment status
export const getStudentMonthlyStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const centerId = req.user?.centerId!;
    
    // Generate last 12 months
    const months: string[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    }

    const monthlyStatus = await PaymentService.getStudentMonthlyStatus(studentId, centerId, months);

    res.json({
      success: true,
      data: monthlyStatus,
      message: 'Student monthly payment status retrieved successfully'
    });
  } catch (error) {
    const errorInfo = handleError(error as Error);
    res.status(errorInfo.statusCode).json({
      success: false,
      message: errorInfo.message
    });
  }
};

// Get payment summary/analytics
export const getPaymentSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const centerId = req.user?.centerId!;
    const month = req.query.month as string;

    const summary = await PaymentService.getPaymentSummary(centerId, month);

    res.json({
      success: true,
      data: summary,
      message: 'Payment summary retrieved successfully'
    });
  } catch (error) {
    const errorInfo = handleError(error as Error);
    res.status(errorInfo.statusCode).json({
      success: false,
      message: errorInfo.message
    });
  }
};

// Record payment (alias for create with specific business logic)
export const recordPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      studentId,
      month,
      subjectIds,
      paidAmount,
      paymentDate,
      method,
      note
    } = req.body;

    const recordedBy = req.user?.userId!;
    const centerId = req.user?.centerId!;

    // Get subject fees for the student
    const enrollments = await PaymentService.getStudentEnrollments(studentId, centerId);
    
    const subjects = subjectIds.map((subjectId: string) => {
      // For now, since enrollments is empty due to placeholder implementation,
      // we'll use a default amount. This will be updated when Prisma migration is complete.
      // TypeScript workaround for placeholder implementation
      const enrollment: any = enrollments.find((e: any) => e?.group?.subjectId === subjectId);
      return {
        subjectId,
        amount: enrollment?.group?.subject?.monthlyFee || 100 // Default amount until migration
      };
    });

    const totalAmount = subjects.reduce((sum: number, s: any) => sum + s.amount, 0);

    const paymentData: CreatePaymentRequest = {
      studentId,
      month,
      subjects,
      amount: totalAmount,
      paidAmount: paidAmount || totalAmount,
      paymentDate: paymentDate || new Date().toISOString(),
      method: method || 'cash',
      note
    };

    const payment = await PaymentService.createPayment(paymentData, recordedBy, centerId);

    res.status(201).json({
      success: true,
      data: payment,
      message: 'Payment recorded successfully'
    });
  } catch (error) {
    const errorInfo = handleError(error as Error);
    res.status(errorInfo.statusCode).json({
      success: false,
      message: errorInfo.message,
    });
  }
};

// Mark payment as paid
export const markPaymentAsPaid = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { paymentId } = req.params;
    const { paidAmount, paymentDate, method, note } = req.body;
    const centerId = req.user?.centerId!;

    const updateData: UpdatePaymentRequest = {
      status: 'paid',
      paidAmount,
      paymentDate: paymentDate || new Date().toISOString(),
      method: method || 'cash',
      note
    };

    const payment = await PaymentService.updatePayment(paymentId, updateData, centerId);

    if (!payment) {
      res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
      return;
    }

    res.json({
      success: true,
      data: payment,
      message: 'Payment marked as paid successfully'
    });
  } catch (error) {
    const errorInfo = handleError(error as Error);
    res.status(errorInfo.statusCode).json({
      success: false,
      message: errorInfo.message
    });
  }
};

// Update overdue payments (for cron job)
export const updateOverduePayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const updatedCount = await PaymentService.updateOverduePayments();

    res.json({
      success: true,
      data: { updatedCount },
      message: `${updatedCount} payments marked as overdue`
    });
  } catch (error) {
    const errorInfo = handleError(error as Error);
    res.status(errorInfo.statusCode).json({
      success: false,
      message: errorInfo.message
    });
  }
};
