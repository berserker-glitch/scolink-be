import prisma from '../config/database';
import { CreateStudentRequest, UpdateStudentRequest, StudentResponse, StudentListResponse, EnrollStudentRequest } from '../types/student';

export class StudentService {
  static async createStudent(data: CreateStudentRequest, centerId: string): Promise<StudentResponse> {
    const student = await prisma.student.create({
      data: {
        ...data,
        centerId,
      },
      include: {
        year: true,
        field: true,
        enrollments: {
          include: {
            group: {
              include: {
                subject: true,
              },
            },
          },
        },
      },
    });

    return this.formatStudentResponse(student);
  }

  static async getStudents(
    centerId: string,
    page: number = 1,
    limit: number = 20,
    search?: string,
    yearId?: string,
    fieldId?: string,
    isActive?: boolean
  ): Promise<StudentListResponse> {
    try {
      const skip = (page - 1) * limit;

      const where: any = {
        centerId,
        ...(isActive !== undefined && { isActive }),
        ...(yearId && { yearId }),
        ...(fieldId && { fieldId }),
        ...(search && (() => {
          const searchTerms = search.trim().split(/\s+/).filter(term => term.length > 0);
          
          if (searchTerms.length === 1) {
            // Single term search - search in all relevant fields
            return {
              OR: [
                { firstName: { contains: searchTerms[0] } },
                { lastName: { contains: searchTerms[0] } },
                { phone: { contains: searchTerms[0] } },
                { parentPhone: { contains: searchTerms[0] } },
                { cni: { contains: searchTerms[0] } },
                { tag: { contains: searchTerms[0] } },
                // Search in related fields
                { year: { name: { contains: searchTerms[0] } } },
                { field: { name: { contains: searchTerms[0] } } },
              ]
            };
          } else if (searchTerms.length > 1) {
            // Multi-term search - each term must match at least one field
            return {
              AND: searchTerms.map(term => ({
                OR: [
                  { firstName: { contains: term } },
                  { lastName: { contains: term } },
                  { phone: { contains: term } },
                  { parentPhone: { contains: term } },
                  { cni: { contains: term } },
                  { tag: { contains: term } },
                  { year: { name: { contains: term } } },
                  { field: { name: { contains: term } } },
                ]
              }))
            };
          }
          
          return {};
        })()),
      };

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { firstName: 'asc' },
          { lastName: 'asc' },
        ],
        include: {
          year: true,
          field: true,
          enrollments: {
            include: {
              group: {
                include: {
                  subject: true,
                },
              },
            },
          },
        },
      }),
      prisma.student.count({ where }),
    ]);

      const formattedStudents = students.map(student => this.formatStudentResponse(student));

      return {
        students: formattedStudents,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error in StudentService.getStudents:', error);
      throw error;
    }
  }

  static async getStudentById(id: string, centerId: string): Promise<StudentResponse | null> {
    const student = await prisma.student.findFirst({
      where: { id, centerId },
      include: {
        year: true,
        field: true,
        enrollments: {
          include: {
            group: {
              include: {
                subject: true,
              },
            },
          },
        },
      },
    });

    if (!student) return null;

    return this.formatStudentResponse(student);
  }

  static async updateStudent(id: string, data: UpdateStudentRequest, centerId: string): Promise<StudentResponse | null> {
    const existingStudent = await prisma.student.findFirst({
      where: { id, centerId },
    });

    if (!existingStudent) return null;

    const updatedStudent = await prisma.student.update({
      where: { id },
      data,
      include: {
        year: true,
        field: true,
        enrollments: {
          include: {
            group: {
              include: {
                subject: true,
              },
            },
          },
        },
      },
    });

    return this.formatStudentResponse(updatedStudent);
  }

  static async deleteStudent(id: string, centerId: string): Promise<boolean> {
    const existingStudent = await prisma.student.findFirst({
      where: { id, centerId },
    });

    if (!existingStudent) return false;

    await prisma.student.delete({
      where: { id },
    });

    return true;
  }

  static async enrollStudent(data: EnrollStudentRequest, centerId: string): Promise<boolean> {
    // Verify student belongs to center
    const student = await prisma.student.findFirst({
      where: { id: data.studentId, centerId },
    });

    if (!student) return false;

    // Verify group belongs to center
    const group = await prisma.group.findFirst({
      where: { id: data.groupId, centerId },
    });

    if (!group) return false;

    // Check if enrollment already exists
    const existingEnrollment = await prisma.studentEnrollment.findFirst({
      where: {
        studentId: data.studentId,
        groupId: data.groupId,
      },
    });

    if (existingEnrollment) return false;

    // Create enrollment
    await prisma.studentEnrollment.create({
      data: {
        studentId: data.studentId,
        groupId: data.groupId,
      },
    });

    return true;
  }

  static async unenrollStudent(studentId: string, groupId: string, centerId: string): Promise<boolean> {
    // Verify student belongs to center
    const student = await prisma.student.findFirst({
      where: { id: studentId, centerId },
    });

    if (!student) return false;

    // Find and delete enrollment
    const enrollment = await prisma.studentEnrollment.findFirst({
      where: {
        studentId,
        groupId,
        student: { centerId },
      },
    });

    if (!enrollment) return false;

    await prisma.studentEnrollment.delete({
      where: { id: enrollment.id },
    });

    return true;
  }

  static async getStudentEnrollments(studentId: string, centerId: string) {
    const student = await prisma.student.findFirst({
      where: { id: studentId, centerId },
      include: {
        enrollments: {
          include: {
            group: {
              include: {
                subject: true,
                teacher: true,
                schedules: true,
              },
            },
          },
        },
      },
    });

    if (!student) return null;

    return student.enrollments.map(enrollment => ({
      id: enrollment.id,
      groupId: enrollment.groupId,
      groupName: enrollment.group.name,
      subjectName: enrollment.group.subject.name,
      teacherName: enrollment.group.teacher?.name,
      classNumber: enrollment.group.classNumber,
      capacity: enrollment.group.capacity,
      schedules: enrollment.group.schedules,
    }));
  }

  private static formatStudentResponse(student: any): StudentResponse {
    return {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      sex: student.sex,
      yearId: student.yearId,
      fieldId: student.fieldId,
      phone: student.phone,
      parentPhone: student.parentPhone,
      parentType: student.parentType,
      tag: student.tag,
      cni: student.cni,
      centerId: student.centerId,
      isActive: student.isActive,
      createdAt: student.createdAt.toISOString(),
      updatedAt: student.updatedAt.toISOString(),
      yearName: student.year?.name,
      fieldName: student.field?.name,
      enrollments: student.enrollments?.map((enrollment: any) => ({
        id: enrollment.id,
        groupId: enrollment.groupId,
        groupName: enrollment.group?.name,
        subjectId: enrollment.group?.subject?.id,
        subjectName: enrollment.group?.subject?.name,
      })),
    };
  }

  // Enrollment management methods
  static async createEnrollments(
    studentId: string, 
    centerId: string,
    enrollments: { subjectId: string; groupId: string }[]
  ): Promise<any[]> {
    try {
      // First verify the student belongs to this center
      const student = await this.getStudentById(studentId, centerId);
      if (!student) {
        throw new Error('Student not found or does not belong to this center');
      }

      // Verify all groups belong to the same center and exist
      const groups = await prisma.group.findMany({
        where: {
          id: { in: enrollments.map(e => e.groupId) },
          centerId: centerId,
          isActive: true
        },
        include: {
          subject: true
        }
      });

      if (groups.length !== enrollments.length) {
        throw new Error('One or more groups not found or inactive');
      }

      // Validate that each group corresponds to the correct subject
      for (const enrollment of enrollments) {
        const group = groups.find(g => g.id === enrollment.groupId);
        if (!group || group.subject.id !== enrollment.subjectId) {
          throw new Error(`Group ${enrollment.groupId} does not match subject ${enrollment.subjectId}`);
        }
      }

      // Create enrollment records
      const results = [];
      for (const enrollment of enrollments) {
        try {
          // Check if enrollment already exists
          const existing = await prisma.studentEnrollment.findUnique({
            where: {
              studentId_groupId: {
                studentId: studentId,
                groupId: enrollment.groupId
              }
            }
          });

          if (existing) {
            results.push({
              subjectId: enrollment.subjectId,
              groupId: enrollment.groupId,
              status: 'already_enrolled',
              enrollmentId: existing.id
            });
            continue;
          }

          // Create new enrollment
          const newEnrollment = await prisma.studentEnrollment.create({
            data: {
              studentId: studentId,
              groupId: enrollment.groupId
            }
          });

          results.push({
            subjectId: enrollment.subjectId,
            groupId: enrollment.groupId,
            status: 'enrolled',
            enrollmentId: newEnrollment.id,
            enrolledAt: newEnrollment.createdAt.toISOString()
          });

        } catch (enrollmentError) {
          console.error(`Error creating enrollment for group ${enrollment.groupId}:`, enrollmentError);
          results.push({
            subjectId: enrollment.subjectId,
            groupId: enrollment.groupId,
            status: 'failed',
            error: enrollmentError instanceof Error ? enrollmentError.message : 'Unknown error'
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Create enrollments service error:', error);
      throw error;
    }
  }

  static async updateEnrollment(
    studentId: string,
    enrollmentId: string,
    newGroupId: string,
    centerId: string
  ): Promise<any> {
    try {
      // Verify the enrollment exists and belongs to the student in this center
      const enrollment = await prisma.studentEnrollment.findFirst({
        where: {
          id: enrollmentId,
          studentId: studentId,
          student: {
            centerId: centerId
          }
        }
      });

      if (!enrollment) {
        throw new Error('Enrollment not found');
      }

      // Verify the new group exists and is active in this center
      const group = await prisma.group.findFirst({
        where: {
          id: newGroupId,
          centerId: centerId,
          isActive: true
        }
      });

      if (!group) {
        throw new Error('Group not found or inactive');
      }

      // Update the enrollment
      const updatedEnrollment = await prisma.studentEnrollment.update({
        where: { id: enrollmentId },
        data: { groupId: newGroupId }
      });

      return {
        enrollmentId: updatedEnrollment.id,
        studentId: updatedEnrollment.studentId,
        groupId: updatedEnrollment.groupId,
        updatedAt: updatedEnrollment.updatedAt.toISOString()
      };
    } catch (error) {
      console.error('Update enrollment service error:', error);
      throw error;
    }
  }

  static async deleteEnrollment(
    studentId: string,
    enrollmentId: string,
    centerId: string
  ): Promise<boolean> {
    try {
      // Verify the enrollment exists and belongs to the student in this center
      const enrollment = await prisma.studentEnrollment.findFirst({
        where: {
          id: enrollmentId,
          studentId: studentId,
          student: {
            centerId: centerId
          }
        }
      });

      if (!enrollment) {
        throw new Error('Enrollment not found');
      }

      // Delete the enrollment
      await prisma.studentEnrollment.delete({
        where: { id: enrollmentId }
      });

      return true;
    } catch (error) {
      console.error('Delete enrollment service error:', error);
      throw error;
    }
  }
}
