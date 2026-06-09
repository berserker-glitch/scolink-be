import { PaymentMethod, PaymentStatus } from '@prisma/client';

const mockPrisma = {
  student: {
    findFirst: jest.fn(),
  },
  studentEnrollment: {
    findMany: jest.fn(),
  },
  payment: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    updateMany: jest.fn(),
  },
};

jest.mock('../src/config/database', () => mockPrisma);

import { PaymentService } from '../src/services/paymentService';

const paymentDates = {
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('PaymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('persists payments with server-side enrolled subject amounts and lowercase API status mapping', async () => {
    mockPrisma.student.findFirst.mockResolvedValue({ id: 'student-1' });
    mockPrisma.studentEnrollment.findMany.mockResolvedValue([
      {
        group: {
          subjectId: 'subject-1',
          subject: {
            id: 'subject-1',
            name: 'Math',
            monthlyFee: 100,
          },
        },
      },
    ]);
    mockPrisma.payment.create.mockImplementation(async ({ data }) => ({
      id: 'payment-1',
      studentId: data.studentId,
      month: data.month,
      amount: data.amount,
      paidAmount: data.paidAmount,
      status: data.status,
      paymentDate: data.paymentDate,
      dueDate: data.dueDate,
      method: data.method,
      note: data.note,
      recordedBy: data.recordedBy,
      centerId: data.centerId,
      subjects: data.subjects.create.map((subject: any) => ({
        ...subject,
        subject: { id: subject.subjectId, name: 'Math' },
      })),
      student: {
        id: data.studentId,
        firstName: 'Student',
        lastName: 'One',
      },
      ...paymentDates,
    }));

    const result = await PaymentService.createPayment(
      {
        studentId: 'student-1',
        month: '2026-05',
        subjects: [{ subjectId: 'subject-1', amount: 1 }],
        amount: 100,
        paidAmount: 50,
        method: 'cash',
      },
      'user-1',
      'center-1'
    );

    expect(mockPrisma.studentEnrollment.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        studentId: 'student-1',
        student: { centerId: 'center-1' },
      },
    }));
    expect(mockPrisma.payment.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        amount: 100,
        paidAmount: 50,
        status: PaymentStatus.PARTIAL,
        method: PaymentMethod.CASH,
        centerId: 'center-1',
        subjects: {
          create: [{ subjectId: 'subject-1', amount: 100 }],
        },
      }),
    }));
    expect(result.status).toBe('partial');
    expect(result.method).toBe('cash');
    expect(result.amount).toBe(100);
  });

  it('rejects client-supplied amounts that do not match center-owned enrollments', async () => {
    mockPrisma.student.findFirst.mockResolvedValue({ id: 'student-1' });
    mockPrisma.studentEnrollment.findMany.mockResolvedValue([
      {
        group: {
          subjectId: 'subject-1',
          subject: {
            id: 'subject-1',
            name: 'Math',
            monthlyFee: 100,
          },
        },
      },
    ]);

    await expect(
      PaymentService.createPayment(
        {
          studentId: 'student-1',
          month: '2026-05',
          subjects: [{ subjectId: 'subject-1', amount: 1 }],
          amount: 1,
        },
        'user-1',
        'center-1'
      )
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(mockPrisma.payment.create).not.toHaveBeenCalled();
  });

  it('scopes overdue updates to the caller center', async () => {
    mockPrisma.payment.updateMany.mockResolvedValue({ count: 2 });

    const updatedCount = await PaymentService.updateOverduePayments('center-1');

    expect(updatedCount).toBe(2);
    expect(mockPrisma.payment.updateMany).toHaveBeenCalledWith({
      where: {
        centerId: 'center-1',
        status: { in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL] },
        dueDate: { lt: expect.any(Date) },
      },
      data: {
        status: PaymentStatus.OVERDUE,
      },
    });
  });
});
