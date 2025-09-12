import prisma from '../config/database';
import { 
  Payment, 
  CreatePaymentRequest, 
  UpdatePaymentRequest, 
  PaymentSummary, 
  MonthlyPaymentStatus 
} from '../types/payment';

export class PaymentService {
  // Create a new payment record
  static async createPayment(
    data: CreatePaymentRequest, 
    recordedBy: string, 
    centerId: string
  ): Promise<Payment> {
    // TODO: This is a placeholder until database migrations are complete
    // The actual Prisma models will be available after migration
    
    // Calculate due date (end of the month)
    const [year, month] = data.month.split('-');
    const dueDate = new Date(parseInt(year), parseInt(month), 0); // Last day of month
    
    // Determine initial status based on paid amount
    let status: 'paid' | 'partial' | 'pending' | 'overdue' = 'pending';
    const paidAmount = data.paidAmount || 0;
    
    if (paidAmount >= data.amount) {
      status = 'paid';
    } else if (paidAmount > 0) {
      status = 'partial';
    } else if (new Date() > dueDate) {
      status = 'overdue';
    }

    // Placeholder implementation until Prisma migration is complete
    const paymentId = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const payment = {
      id: paymentId,
      studentId: data.studentId,
      month: data.month,
      amount: data.amount,
      paidAmount: paidAmount,
      status,
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : null,
      dueDate,
      method: data.method || null,
      note: data.note || null,
      recordedBy,
      centerId,
      subjects: data.subjects,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // When Prisma migrations are complete, replace with:
    /*
    const payment = await prisma.payment.create({
      data: {
        studentId: data.studentId,
        month: data.month,
        amount: data.amount,
        paidAmount: paidAmount,
        status,
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : null,
        dueDate,
        method: data.method || null,
        note: data.note || null,
        recordedBy,
        centerId,
        subjects: {
          create: data.subjects.map(subject => ({
            subjectId: subject.subjectId,
            amount: subject.amount
          }))
        }
      },
      include: {
        subjects: {
          include: {
            subject: true
          }
        },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
    */

    return this.formatPaymentResponse(payment);
  }

  // Get payments with filtering and pagination
  static async getPayments(
    centerId: string,
    filters: {
      page?: number;
      limit?: number;
      studentId?: string;
      month?: string;
      status?: string;
      search?: string;
    } = {}
  ) {
    // Placeholder implementation until Prisma migration is complete
    return {
      payments: [],
      pagination: {
        page: filters.page || 1,
        limit: filters.limit || 20,
        total: 0,
        totalPages: 0
      }
    };

    // When Prisma migrations are complete, replace with:
    /*
    const {
      page = 1,
      limit = 20,
      studentId,
      month,
      status,
      search
    } = filters;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      centerId,
      ...(studentId && { studentId }),
      ...(month && { month }),
      ...(status && { status }),
      ...(search && {
        OR: [
          {
            student: {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } }
              ]
            }
          },
          { note: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          subjects: {
            include: {
              subject: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: [
          { month: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.payment.count({ where })
    ]);

    return {
      payments: payments.map(this.formatPaymentResponse),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
    */
  }

  // Get payment by ID
  static async getPaymentById(paymentId: string, centerId: string): Promise<Payment | null> {
    // Placeholder implementation until Prisma migration is complete
    return null;

    // When Prisma migrations are complete, replace with:
    /*
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        centerId
      },
      include: {
        subjects: {
          include: {
            subject: true
          }
        },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return payment ? this.formatPaymentResponse(payment) : null;
    */
  }

  // Update payment
  static async updatePayment(
    paymentId: string, 
    data: UpdatePaymentRequest, 
    centerId: string
  ): Promise<Payment | null> {
    // Placeholder implementation until Prisma migration is complete
    return null;

    // When Prisma migrations are complete, replace with:
    /*
    // Get current payment to calculate new status if needed
    const currentPayment = await prisma.payment.findFirst({
      where: { id: paymentId, centerId }
    });

    if (!currentPayment) {
      return null;
    }

    // Auto-calculate status if paidAmount is updated
    let newStatus = data.status;
    if (data.paidAmount !== undefined && !data.status) {
      const amount = data.amount || currentPayment.amount;
      if (data.paidAmount >= amount) {
        newStatus = 'paid';
      } else if (data.paidAmount > 0) {
        newStatus = 'partial';
      } else {
        newStatus = new Date() > currentPayment.dueDate ? 'overdue' : 'pending';
      }
    }

    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        ...data,
        ...(data.paymentDate && { paymentDate: new Date(data.paymentDate) }),
        ...(newStatus && { status: newStatus }),
        updatedAt: new Date()
      },
      include: {
        subjects: {
          include: {
            subject: true
          }
        },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return this.formatPaymentResponse(payment);
    */
  }

  // Delete payment
  static async deletePayment(paymentId: string, centerId: string): Promise<boolean> {
    // Placeholder implementation until Prisma migration is complete
    return false;

    // When Prisma migrations are complete, replace with:
    /*
    const result = await prisma.payment.deleteMany({
      where: {
        id: paymentId,
        centerId
      }
    });

    return result.count > 0;
    */
  }

  // Get student's payments
  static async getStudentPayments(
    studentId: string, 
    centerId: string,
    limit: number = 50
  ): Promise<Payment[]> {
    // Placeholder implementation until Prisma migration is complete
    return [];

    // When Prisma migrations are complete, replace with:
    /*
    const payments = await prisma.payment.findMany({
      where: {
        studentId,
        centerId
      },
      include: {
        subjects: {
          include: {
            subject: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { month: 'desc' },
      take: limit
    });

    return payments.map(this.formatPaymentResponse);
    */
  }

  // Get monthly payment status for a student
  static async getStudentMonthlyStatus(
    studentId: string, 
    centerId: string, 
    months: string[]
  ): Promise<MonthlyPaymentStatus[]> {
    // Placeholder implementation until Prisma migration is complete
    return months.map(month => ({
      month,
      studentId,
      totalAmount: 0,
      paidAmount: 0,
      status: 'pending' as any,
      dueDate: new Date().toISOString(),
      subjects: []
    }));

    // When Prisma migrations are complete, replace with:
    /*
    const payments = await prisma.payment.findMany({
      where: {
        studentId,
        centerId,
        month: { in: months }
      },
      include: {
        subjects: {
          include: {
            subject: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    // Get student's current enrollments to calculate expected amounts
    const enrollments = await prisma.enrollment.findMany({
      where: {
        studentId,
        isActive: true
      },
      include: {
        group: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                monthlyFee: true
              }
            }
          }
        }
      }
    });

    return months.map((month: string) => {
      const payment = payments.find((p: any) => p.month === month);
      const expectedAmount = enrollments.reduce((sum: number, enrollment: any) => 
        sum + (enrollment.group.subject?.monthlyFee || 0), 0
      );

      if (payment) {
        return {
          month,
          studentId,
          totalAmount: payment.amount,
          paidAmount: payment.paidAmount || 0,
          status: payment.status as any,
          dueDate: payment.dueDate.toISOString(),
          subjects: payment.subjects.map((ps: any) => ({
            subjectId: ps.subjectId,
            subjectName: ps.subject?.name || 'Unknown',
            amount: ps.amount,
            paid: payment.status === 'paid' || payment.status === 'partial'
          }))
        };
      } else {
        // No payment record exists for this month
        const [year, monthNum] = month.split('-');
        const dueDate = new Date(parseInt(year), parseInt(monthNum), 0);
        const isOverdue = new Date() > dueDate;

        return {
          month,
          studentId,
          totalAmount: expectedAmount,
          paidAmount: 0,
          status: isOverdue ? 'overdue' : 'pending' as any,
          dueDate: dueDate.toISOString(),
          subjects: enrollments.map((enrollment: any) => ({
            subjectId: enrollment.group.subject?.id || '',
            subjectName: enrollment.group.subject?.name || 'Unknown',
            amount: enrollment.group.subject?.monthlyFee || 0,
            paid: false
          }))
        };
      }
    });
    */
  }

  // Get payment summary/analytics
  static async getPaymentSummary(
    centerId: string,
    month?: string
  ): Promise<PaymentSummary> {
    // Placeholder implementation until Prisma migration is complete
    return {
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      overdueAmount: 0,
      paymentCount: 0,
      paidCount: 0,
      pendingCount: 0,
      overdueCount: 0
    };

    // When Prisma migrations are complete, replace with:
    /*
    const where: any = { centerId };
    if (month) {
      where.month = month;
    }

    const payments = await prisma.payment.findMany({
      where,
      select: {
        amount: true,
        paidAmount: true,
        status: true
      }
    });

    const summary = payments.reduce((acc: PaymentSummary, payment: any) => {
      acc.totalAmount += payment.amount;
      acc.paidAmount += payment.paidAmount || 0;
      acc.paymentCount++;

      switch (payment.status) {
        case 'paid':
          acc.paidCount++;
          break;
        case 'pending':
        case 'partial':
          acc.pendingCount++;
          acc.pendingAmount += payment.amount - (payment.paidAmount || 0);
          break;
        case 'overdue':
          acc.overdueCount++;
          acc.overdueAmount += payment.amount - (payment.paidAmount || 0);
          break;
      }

      return acc;
    }, {
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      overdueAmount: 0,
      paymentCount: 0,
      paidCount: 0,
      pendingCount: 0,
      overdueCount: 0
    });

    return summary;
    */
  }

  // Update overdue payments (call this in a cron job)
  static async updateOverduePayments(centerId?: string): Promise<number> {
    // Placeholder implementation until Prisma migration is complete
    return 0;

    // When Prisma migrations are complete, replace with:
    /*
    const today = new Date();
    
    const where: any = {
      status: { in: ['pending', 'partial'] },
      dueDate: { lt: today }
    };

    if (centerId) {
      where.centerId = centerId;
    }

    const result = await prisma.payment.updateMany({
      where,
      data: {
        status: 'overdue',
        updatedAt: new Date()
      }
    });

    return result.count;
    */
  }

  // Get student enrollments (helper method)
  static async getStudentEnrollments(studentId: string, centerId: string) {
    // Placeholder implementation until Prisma migration is complete
    return [];

    // When Prisma migrations are complete, replace with:
    /*
    return await prisma.enrollment.findMany({
      where: {
        studentId,
        isActive: true,
        student: {
          centerId
        }
      },
      include: {
        group: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                monthlyFee: true
              }
            }
          }
        }
      }
    });
    */
  }

  // Helper method to format payment response
  private static formatPaymentResponse(payment: any): Payment {
    return {
      id: payment.id,
      studentId: payment.studentId,
      month: payment.month,
      amount: payment.amount,
      paidAmount: payment.paidAmount,
      status: payment.status,
      paymentDate: payment.paymentDate?.toISOString ? payment.paymentDate.toISOString() : payment.paymentDate,
      dueDate: payment.dueDate?.toISOString ? payment.dueDate.toISOString() : payment.dueDate,
      method: payment.method,
      note: payment.note,
      subjects: Array.isArray(payment.subjects) ? payment.subjects.map((ps: any) => ({
        subjectId: ps.subjectId,
        amount: ps.amount
      })) : payment.subjects,
      recordedBy: payment.recordedBy,
      centerId: payment.centerId,
      createdAt: payment.createdAt?.toISOString ? payment.createdAt.toISOString() : payment.createdAt,
      updatedAt: payment.updatedAt?.toISOString ? payment.updatedAt.toISOString() : payment.updatedAt
    };
  }
}
