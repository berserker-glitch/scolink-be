import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import {
  createPayment,
  getPayments,
  getPaymentById,
  updatePayment,
  deletePayment,
  getStudentPayments,
  getStudentMonthlyStatus,
  getPaymentSummary,
  recordPayment,
  markPaymentAsPaid,
  updateOverduePayments
} from '../controllers/paymentController';
import {
  createPaymentSchema,
  updatePaymentSchema,
  paymentQuerySchema
} from '../types/payment';

const router = Router();

// All payment routes require authentication
router.use(authenticate);

// Payment CRUD routes
router.post('/', validate(createPaymentSchema), createPayment);
router.get('/', validate(paymentQuerySchema), getPayments);
router.get('/summary', getPaymentSummary);
router.get('/:paymentId', getPaymentById);
router.put('/:paymentId', validate(updatePaymentSchema), updatePayment);
router.delete('/:paymentId', deletePayment);

// Student-specific payment routes
router.get('/student/:studentId', getStudentPayments);
router.get('/student/:studentId/monthly-status', getStudentMonthlyStatus);

// Special payment operations
router.post('/record', recordPayment); // Simplified payment recording
router.patch('/:paymentId/mark-paid', markPaymentAsPaid);

// Administrative routes
router.post('/update-overdue', updateOverduePayments); // For cron jobs

export default router;
