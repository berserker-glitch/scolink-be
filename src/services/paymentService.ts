import { PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';
import prisma from '../config/database';
import {
  Payment,
  CreatePaymentRequest,
  UpdatePaymentRequest,
  PaymentSummary,
  MonthlyPaymentStatus
} from '../types/payment';
import { createError } from '../utils/errorHandler';

type PaymentWithRelations = Prisma.PaymentGetPayload<{
  include: {
    subjects: {
      include: {
        subject: true;
      };
    };
    student: {
      select: {
        id: true;
        firstName: true;
        lastName: true;
      };
    };
  };
}>;

export class PaymentService {
  static async createPayment(
    data: CreatePaymentRequest,
    recordedBy: string,
    centerId: string
  ): Promise<Payment> {
    const { subjectAmounts, totalAmount } = await this.resolveStudentSubjectAmounts(
      data.studentId,
      centerId,
      data.subjects.map(subject => subject.subjectId)
    );

    if (Math.abs(data.amount - totalAmount) > 0.01) {
      throw createError('Payment amount does not match enrolled subject fees', 400);
    }

    const paidAmount = data.paidAmount ?? 0;
    if (paidAmount > totalAmount) {
      throw createError('Paid amount cannot exceed payment amount', 400);
    }

    const dueDate = this.getDueDate(data.month);
    const status = this.calculateStatus(totalAmount, paidAmount, dueDate);

    try {
      const payment = await prisma.payment.create({
        data: {
          studentId: data.studentId,
          month: data.month,
          amount: totalAmount,
          paidAmount,
          status,
          paymentDate: data.paymentDate ? new Date(data.paymentDate) : paidAmount > 0 ? new Date() : null,
          dueDate,
          method: data.method ? this.toPrismaMethod(data.method) : null,
          note: data.note || null,
          recordedBy,
          centerId,
          subjects: {
            create: subjectAmounts.map(subject => ({
              subjectId: subject.subjectId,
              amount: subject.amount
            }))
          }
        },
        include: this.paymentInclude()
      });

      return this.formatPaymentResponse(payment);
    } catch (error) {
      if (this.isPrismaKnownError(error, 'P2002')) {
        throw createError('Payment already exists for this student and month', 409);
      }

      throw error;
    }
  }

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
    const {
      page = 1,
      limit = 20,
      studentId,
      month,
      status,
      search
    } = filters;

    const skip = (page - 1) * limit;
    const where: Prisma.PaymentWhereInput = {
      centerId,
      ...(studentId && { studentId }),
      ...(month && { month }),
      ...(status && { status: this.toPrismaStatus(status as Payment['status']) }),
      ...(search && {
        OR: [
          { student: { firstName: { contains: search } } },
          { student: { lastName: { contains: search } } },
          { note: { contains: search } }
        ]
      })
    };

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: this.paymentInclude(),
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
      payments: payments.map(payment => this.formatPaymentResponse(payment)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async getPaymentById(paymentId: string, centerId: string): Promise<Payment | null> {
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        centerId
      },
      include: this.paymentInclude()
    });

    return payment ? this.formatPaymentResponse(payment) : null;
  }

  static async updatePayment(
    paymentId: string,
    data: UpdatePaymentRequest,
    centerId: string
  ): Promise<Payment | null> {
    const currentPayment = await prisma.payment.findFirst({
      where: { id: paymentId, centerId }
    });

    if (!currentPayment) {
      return null;
    }

    const amount = data.amount ?? Number(currentPayment.amount);
    const paidAmount = data.paidAmount ?? Number(currentPayment.paidAmount ?? 0);

    if (paidAmount > amount) {
      throw createError('Paid amount cannot exceed payment amount', 400);
    }

    const status = this.calculateStatus(
      amount,
      paidAmount,
      currentPayment.dueDate,
      data.status
    );

    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        ...(data.amount !== undefined && { amount }),
        ...(data.paidAmount !== undefined && { paidAmount }),
        status,
        ...(data.paymentDate && { paymentDate: new Date(data.paymentDate) }),
        ...(data.method && { method: this.toPrismaMethod(data.method) }),
        ...(data.note !== undefined && { note: data.note || null })
      },
      include: this.paymentInclude()
    });

    return this.formatPaymentResponse(payment);
  }

  static async deletePayment(paymentId: string, centerId: string): Promise<boolean> {
    const result = await prisma.payment.deleteMany({
      where: {
        id: paymentId,
        centerId
      }
    });

    return result.count > 0;
  }

  static async getStudentPayments(
    studentId: string,
    centerId: string,
    limit: number = 50
  ): Promise<Payment[]> {
    const payments = await prisma.payment.findMany({
      where: {
        studentId,
        centerId
      },
      include: this.paymentInclude(),
      orderBy: { month: 'desc' },
      take: limit
    });

    return payments.map(payment => this.formatPaymentResponse(payment));
  }

  static async getStudentMonthlyStatus(
    studentId: string,
    centerId: string,
    months: string[]
  ): Promise<MonthlyPaymentStatus[]> {
    const [student, payments, enrollments] = await Promise.all([
      prisma.student.findFirst({
        where: { id: studentId, centerId },
        select: { id: true }
      }),
      prisma.payment.findMany({
        where: {
          studentId,
          centerId,
          month: { in: months }
        },
        include: {
          subjects: {
            include: {
              subject: true
            }
          }
        }
      }),
      this.getStudentEnrollments(studentId, centerId)
    ]);

    if (!student) {
      throw createError('Student not found', 404);
    }

    const expectedSubjects = enrollments.map((enrollment: any) => ({
      subjectId: enrollment.group.subject.id,
      subjectName: enrollment.group.subject.name,
      amount: Number(enrollment.group.subject.monthlyFee)
    }));

    return months.map(month => {
      const payment = payments.find(p => p.month === month);

      if (payment) {
        return {
          month,
          studentId,
          totalAmount: Number(payment.amount),
          paidAmount: Number(payment.paidAmount ?? 0),
          status: this.fromPrismaStatus(payment.status),
          dueDate: payment.dueDate.toISOString(),
          subjects: payment.subjects.map(ps => ({
            subjectId: ps.subjectId,
            subjectName: ps.subject.name,
            amount: Number(ps.amount),
            paid: payment.status === PaymentStatus.PAID || payment.status === PaymentStatus.PARTIAL
          }))
        };
      }

      const dueDate = this.getDueDate(month);
      const status: Payment['status'] = new Date() > dueDate ? 'overdue' : 'pending';

      return {
        month,
        studentId,
        totalAmount: expectedSubjects.reduce((sum, subject) => sum + subject.amount, 0),
        paidAmount: 0,
        status,
        dueDate: dueDate.toISOString(),
        subjects: expectedSubjects.map(subject => ({
          ...subject,
          paid: false
        }))
      };
    });
  }

  static async getPaymentSummary(centerId: string, month?: string): Promise<PaymentSummary> {
    const payments = await prisma.payment.findMany({
      where: {
        centerId,
        ...(month && { month })
      },
      select: {
        amount: true,
        paidAmount: true,
        status: true
      }
    });

    return payments.reduce<PaymentSummary>((acc, payment) => {
      const amount = Number(payment.amount);
      const paidAmount = Number(payment.paidAmount ?? 0);

      acc.totalAmount += amount;
      acc.paidAmount += paidAmount;
      acc.paymentCount += 1;

      switch (payment.status) {
        case PaymentStatus.PAID:
          acc.paidCount += 1;
          break;
        case PaymentStatus.OVERDUE:
          acc.overdueCount += 1;
          acc.overdueAmount += amount - paidAmount;
          break;
        case PaymentStatus.PARTIAL:
        case PaymentStatus.PENDING:
          acc.pendingCount += 1;
          acc.pendingAmount += amount - paidAmount;
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
  }

  static async updateOverduePayments(centerId?: string): Promise<number> {
    const result = await prisma.payment.updateMany({
      where: {
        ...(centerId && { centerId }),
        status: { in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL] },
        dueDate: { lt: new Date() }
      },
      data: {
        status: PaymentStatus.OVERDUE
      }
    });

    return result.count;
  }

  static async getStudentEnrollments(studentId: string, centerId: string) {
    return prisma.studentEnrollment.findMany({
      where: {
        studentId,
        student: {
          centerId
        }
      },
      include: {
        group: {
          include: {
            subject: true
          }
        }
      }
    });
  }

  private static async resolveStudentSubjectAmounts(
    studentId: string,
    centerId: string,
    subjectIds: string[]
  ): Promise<{ subjectAmounts: Array<{ subjectId: string; amount: number }>; totalAmount: number }> {
    const uniqueSubjectIds = Array.from(new Set(subjectIds));
    if (uniqueSubjectIds.length !== subjectIds.length) {
      throw createError('Duplicate subjects are not allowed', 400);
    }

    const student = await prisma.student.findFirst({
      where: { id: studentId, centerId },
      select: { id: true }
    });

    if (!student) {
      throw createError('Student not found', 404);
    }

    const enrollments = await this.getStudentEnrollments(studentId, centerId);
    const enrollmentBySubjectId = new Map<string, any>();

    for (const enrollment of enrollments) {
      enrollmentBySubjectId.set(enrollment.group.subjectId, enrollment);
    }

    const subjectAmounts = uniqueSubjectIds.map(subjectId => {
      const enrollment = enrollmentBySubjectId.get(subjectId);
      if (!enrollment) {
        throw createError('Student is not enrolled in one or more requested subjects', 400);
      }

      return {
        subjectId,
        amount: Number(enrollment.group.subject.monthlyFee)
      };
    });

    return {
      subjectAmounts,
      totalAmount: subjectAmounts.reduce((sum, subject) => sum + subject.amount, 0)
    };
  }

  private static calculateStatus(
    amount: number,
    paidAmount: number,
    dueDate: Date,
    explicitStatus?: Payment['status']
  ): PaymentStatus {
    if (explicitStatus) {
      return this.toPrismaStatus(explicitStatus);
    }

    if (paidAmount >= amount) {
      return PaymentStatus.PAID;
    }

    if (paidAmount > 0) {
      return PaymentStatus.PARTIAL;
    }

    return new Date() > dueDate ? PaymentStatus.OVERDUE : PaymentStatus.PENDING;
  }

  private static getDueDate(month: string): Date {
    const [year, monthNumber] = month.split('-').map(Number);
    if (!year || !monthNumber || monthNumber < 1 || monthNumber > 12) {
      throw createError('Invalid month format. Use YYYY-MM', 400);
    }

    return new Date(year, monthNumber, 0);
  }

  private static paymentInclude() {
    return {
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
    } satisfies Prisma.PaymentInclude;
  }

  private static toPrismaStatus(status: Payment['status']): PaymentStatus {
    return {
      paid: PaymentStatus.PAID,
      partial: PaymentStatus.PARTIAL,
      pending: PaymentStatus.PENDING,
      overdue: PaymentStatus.OVERDUE
    }[status];
  }

  private static fromPrismaStatus(status: PaymentStatus): Payment['status'] {
    return {
      [PaymentStatus.PAID]: 'paid',
      [PaymentStatus.PARTIAL]: 'partial',
      [PaymentStatus.PENDING]: 'pending',
      [PaymentStatus.OVERDUE]: 'overdue'
    }[status] as Payment['status'];
  }

  private static toPrismaMethod(method: NonNullable<Payment['method']>): PaymentMethod {
    return {
      cash: PaymentMethod.CASH,
      transfer: PaymentMethod.TRANSFER,
      check: PaymentMethod.CHECK,
      other: PaymentMethod.OTHER
    }[method];
  }

  private static fromPrismaMethod(method: PaymentMethod | null): Payment['method'] | undefined {
    if (!method) {
      return undefined;
    }

    return {
      [PaymentMethod.CASH]: 'cash',
      [PaymentMethod.TRANSFER]: 'transfer',
      [PaymentMethod.CHECK]: 'check',
      [PaymentMethod.OTHER]: 'other'
    }[method] as Payment['method'];
  }

  private static formatPaymentResponse(payment: PaymentWithRelations): Payment {
    return {
      id: payment.id,
      studentId: payment.studentId,
      month: payment.month,
      amount: Number(payment.amount),
      paidAmount: Number(payment.paidAmount ?? 0),
      status: this.fromPrismaStatus(payment.status),
      paymentDate: payment.paymentDate?.toISOString(),
      dueDate: payment.dueDate.toISOString(),
      method: this.fromPrismaMethod(payment.method),
      note: payment.note || undefined,
      subjects: payment.subjects.map(ps => ({
        subjectId: ps.subjectId,
        amount: Number(ps.amount)
      })),
      recordedBy: payment.recordedBy,
      centerId: payment.centerId,
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString()
    };
  }

  private static isPrismaKnownError(error: unknown, code: string): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
  }
}
