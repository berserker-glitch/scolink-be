import { Response } from 'express';
import { AuthenticatedRequest } from '../types/common';
import { StudentService } from '../services/studentService';
import { createStudentSchema, updateStudentSchema, enrollStudentSchema } from '../types/student';
import { z } from 'zod';

export const createStudent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const validatedData = createStudentSchema.parse(req.body);
    const centerId = req.user!.centerId;

    if (!centerId) {
      res.status(400).json({
        success: false,
        message: 'Center ID is required',
        errors: ['User must be associated with a center'],
      });
      return;
    }

    const student = await StudentService.createStudent(validatedData, centerId);

    res.status(201).json({
      success: true,
      data: student,
      message: 'Student created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map(err => err.message),
      });
      return;
    }

    console.error('Create student error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      errors: ['Failed to create student'],
    });
  }
};

export const getStudents = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const centerId = req.user!.centerId;
    
    if (!centerId) {
      res.status(400).json({
        success: false,
        message: 'Center ID is required',
        errors: ['User must be associated with a center'],
      });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const yearId = req.query.yearId as string;
    const fieldId = req.query.fieldId as string;
    const isActive = req.query.isActive ? req.query.isActive === 'true' : undefined;

    const result = await StudentService.getStudents(
      centerId,
      page,
      limit,
      search,
      yearId,
      fieldId,
      isActive
    );

    res.json({
      success: true,
      data: {
        students: result.students,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      errors: ['Failed to fetch students'],
    });
  }
};

export const getStudentById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const centerId = req.user!.centerId;

    if (!centerId) {
      res.status(400).json({
        success: false,
        message: 'Center ID is required',
        errors: ['User must be associated with a center'],
      });
      return;
    }

    const student = await StudentService.getStudentById(id, centerId);

    if (!student) {
      res.status(404).json({
        success: false,
        message: 'Student not found',
        errors: ['Student does not exist or does not belong to your center'],
      });
      return;
    }

    res.json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error('Get student by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      errors: ['Failed to fetch student'],
    });
  }
};

export const updateStudent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const validatedData = updateStudentSchema.parse(req.body);
    const centerId = req.user!.centerId;

    if (!centerId) {
      res.status(400).json({
        success: false,
        message: 'Center ID is required',
        errors: ['User must be associated with a center'],
      });
      return;
    }

    const student = await StudentService.updateStudent(id, validatedData, centerId);

    if (!student) {
      res.status(404).json({
        success: false,
        message: 'Student not found',
        errors: ['Student does not exist or does not belong to your center'],
      });
      return;
    }

    res.json({
      success: true,
      data: student,
      message: 'Student updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map(err => err.message),
      });
      return;
    }

    console.error('Update student error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      errors: ['Failed to update student'],
    });
  }
};

export const deleteStudent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const centerId = req.user!.centerId;

    if (!centerId) {
      res.status(400).json({
        success: false,
        message: 'Center ID is required',
        errors: ['User must be associated with a center'],
      });
      return;
    }

    const deleted = await StudentService.deleteStudent(id, centerId);

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: 'Student not found',
        errors: ['Student does not exist or does not belong to your center'],
      });
      return;
    }

    res.json({
      success: true,
      message: 'Student deleted successfully',
    });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      errors: ['Failed to delete student'],
    });
  }
};

export const enrollStudent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const validatedData = enrollStudentSchema.parse(req.body);
    const centerId = req.user!.centerId;

    if (!centerId) {
      res.status(400).json({
        success: false,
        message: 'Center ID is required',
        errors: ['User must be associated with a center'],
      });
      return;
    }

    const enrolled = await StudentService.enrollStudent(validatedData, centerId);

    if (!enrolled) {
      res.status(400).json({
        success: false,
        message: 'Enrollment failed',
        errors: ['Student or group not found, or student already enrolled in this group'],
      });
      return;
    }

    res.json({
      success: true,
      message: 'Student enrolled successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map(err => err.message),
      });
      return;
    }

    console.error('Enroll student error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      errors: ['Failed to enroll student'],
    });
  }
};

export const unenrollStudent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { studentId, groupId } = req.params;
    const centerId = req.user!.centerId;

    if (!centerId) {
      res.status(400).json({
        success: false,
        message: 'Center ID is required',
        errors: ['User must be associated with a center'],
      });
      return;
    }

    const unenrolled = await StudentService.unenrollStudent(studentId, groupId, centerId);

    if (!unenrolled) {
      res.status(404).json({
        success: false,
        message: 'Enrollment not found',
        errors: ['Student is not enrolled in this group'],
      });
      return;
    }

    res.json({
      success: true,
      message: 'Student unenrolled successfully',
    });
  } catch (error) {
    console.error('Unenroll student error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      errors: ['Failed to unenroll student'],
    });
  }
};

export const getStudentEnrollments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const centerId = req.user!.centerId;

    if (!centerId) {
      res.status(400).json({
        success: false,
        message: 'Center ID is required',
        errors: ['User must be associated with a center'],
      });
      return;
    }

    const enrollments = await StudentService.getStudentEnrollments(id, centerId);

    if (enrollments === null) {
      res.status(404).json({
        success: false,
        message: 'Student not found',
        errors: ['Student does not exist or does not belong to your center'],
      });
      return;
    }

    res.json({
      success: true,
      data: enrollments,
    });
  } catch (error) {
    console.error('Get student enrollments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      errors: ['Failed to fetch student enrollments'],
    });
  }
};

// Enrollment management functions
export const enrollStudentInSubjects = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const { enrollments } = req.body;

    // Validate input
    if (!enrollments || !Array.isArray(enrollments) || enrollments.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Enrollments array is required and must not be empty',
        errors: ['Invalid enrollment data provided']
      });
      return;
    }

    // Validate each enrollment has required fields
    for (const enrollment of enrollments) {
      if (!enrollment.subjectId || !enrollment.groupId) {
        res.status(400).json({
          success: false,
          message: 'Each enrollment must have subjectId and groupId',
          errors: ['Missing required enrollment fields']
        });
        return;
      }
    }

    // Check if student exists
    const centerId = req.user!.centerId;
    const student = await StudentService.getStudentById(studentId, centerId!);
    if (!student) {
      res.status(404).json({
        success: false,
        message: 'Student not found',
        errors: ['Student does not exist']
      });
      return;
    }

    // Process enrollments using the service
    const results = await StudentService.createEnrollments(studentId, centerId!, enrollments);

    res.status(201).json({
      success: true,
      data: results,
      message: `Successfully processed ${results.filter((r: any) => r.status === 'enrolled').length} enrollment(s)`
    });

  } catch (error) {
    console.error('Error enrolling student in subjects:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enroll student in subjects',
      errors: [error instanceof Error ? error.message : 'Unknown error occurred']
    });
  }
};

export const updateStudentEnrollment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { studentId, enrollmentId } = req.params;
    const { groupId } = req.body;

    // Validate input
    if (!groupId) {
      res.status(400).json({
        success: false,
        message: 'Group ID is required',
        errors: ['Missing groupId in request body']
      });
      return;
    }

    // Check if student exists
    const centerId = req.user!.centerId;
    const student = await StudentService.getStudentById(studentId, centerId!);
    if (!student) {
      res.status(404).json({
        success: false,
        message: 'Student not found',
        errors: ['Student does not exist']
      });
      return;
    }

    // Update enrollment using the service
    const result = await StudentService.updateEnrollment(studentId, enrollmentId, groupId, centerId!);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Enrollment updated successfully'
    });

  } catch (error) {
    console.error('Error updating student enrollment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update enrollment',
      errors: [error instanceof Error ? error.message : 'Unknown error occurred']
    });
  }
};

export const removeStudentEnrollment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { studentId, enrollmentId } = req.params;

    // Check if student exists
    const centerId = req.user!.centerId;
    const student = await StudentService.getStudentById(studentId, centerId!);
    if (!student) {
      res.status(404).json({
        success: false,
        message: 'Student not found',
        errors: ['Student does not exist']
      });
      return;
    }

    // Remove enrollment using the service
    await StudentService.deleteEnrollment(studentId, enrollmentId, centerId!);
    
    res.status(200).json({
      success: true,
      message: 'Enrollment removed successfully'
    });

  } catch (error) {
    console.error('Error removing student enrollment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove enrollment',
      errors: [error instanceof Error ? error.message : 'Unknown error occurred']
    });
  }
};

export const getCurrentStudent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userEmail = req.user!.email; // This is the phone number for students
    const centerId = req.user!.centerId;

    if (!centerId) {
      res.status(403).json({
        success: false,
        message: 'Access denied. User must be associated with a center.',
        errors: ['No center association'],
      });
      return;
    }

    // Find student by phone number (stored as email in user table)
    const student = await StudentService.getStudentByPhone(userEmail, centerId);

    if (!student) {
      res.status(404).json({
        success: false,
        message: 'Student profile not found',
        errors: ['Student does not exist'],
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: student,
      message: 'Student profile retrieved successfully',
    });
  } catch (error) {
    console.error('Get current student error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      errors: ['Failed to retrieve student profile'],
    });
  }
};

export const activateStudentAccount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const { phoneNumber, password } = req.body;
    const centerId = req.user!.centerId;

    if (!centerId) {
      res.status(403).json({
        success: false,
        message: 'Access denied. User must be associated with a center.',
        errors: ['No center association'],
      });
      return;
    }

    if (!phoneNumber || !password) {
      res.status(400).json({
        success: false,
        message: 'Phone number and password are required',
        errors: ['Missing required fields'],
      });
      return;
    }

    const result = await StudentService.activateStudentAccount(studentId, phoneNumber, password, centerId);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Student account activated successfully',
    });
  } catch (error) {
    console.error('Activate student account error:', error);

    if (error instanceof Error && 'statusCode' in error) {
      res.status((error as any).statusCode).json({
        success: false,
        message: error.message,
        errors: [error.message],
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      errors: ['Failed to activate student account'],
    });
  }
};