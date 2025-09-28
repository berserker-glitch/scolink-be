import { Request, Response } from 'express';
import { TeacherService } from '@/services/teacherService';
import { createTeacherSchema, updateTeacherSchema } from '@/types/teacher';
import { validate } from '@/middleware/validation';
import { logger } from '@/utils/logger';
import { AuthRequest } from '@/types/auth';

export class TeacherController {
  static createTeacher = [
    validate(createTeacherSchema),
    async (req: AuthRequest, res: Response): Promise<void> => {
      try {
        const centerId = req.user?.centerId;
        
        if (!centerId) {
          res.status(403).json({
            success: false,
            message: 'Access denied. User must be associated with a center.',
            errors: ['No center association'],
          });
          return;
        }

        const teacher = await TeacherService.createTeacher(centerId, req.body);
        
        res.status(201).json({
          success: true,
          data: teacher,
          message: 'Teacher created successfully',
        });
      } catch (error) {
        logger.error('Create teacher failed', { error: error instanceof Error ? error.message : 'Unknown error' });
        
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
          errors: ['Create teacher failed'],
        });
      }
    },
  ];

  static getTeachers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const centerId = req.user?.centerId;
      
      if (!centerId) {
        res.status(403).json({
          success: false,
          message: 'Access denied. User must be associated with a center.',
          errors: ['No center association'],
        });
        return;
      }

      const pagination = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        search: req.query.search as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await TeacherService.getTeachers(centerId, pagination);
      
      res.status(200).json({
        success: true,
        data: result.teachers,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
        message: 'Teachers retrieved successfully',
      });
    } catch (error) {
      logger.error('Get teachers failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        errors: ['Get teachers failed'],
      });
    }
  };

  static getTeacherById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const centerId = req.user?.centerId;

      if (!centerId) {
        res.status(403).json({
          success: false,
          message: 'Access denied. User must be associated with a center.',
          errors: ['No center association'],
        });
        return;
      }

      const teacher = await TeacherService.getTeacherById(id, centerId);
      
      res.status(200).json({
        success: true,
        data: teacher,
        message: 'Teacher retrieved successfully',
      });
    } catch (error) {
      logger.error('Get teacher failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
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
        errors: ['Get teacher failed'],
      });
    }
  };

  static getTeacherWithGroups = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const centerId = req.user?.centerId;

      if (!centerId) {
        res.status(403).json({
          success: false,
          message: 'Access denied. User must be associated with a center.',
          errors: ['No center association'],
        });
        return;
      }

      const teacher = await TeacherService.getTeacherWithGroups(id, centerId);
      
      res.status(200).json({
        success: true,
        data: teacher,
        message: 'Teacher with groups retrieved successfully',
      });
    } catch (error) {
      logger.error('Get teacher with groups failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
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
        errors: ['Get teacher with groups failed'],
      });
    }
  };

  static updateTeacher = [
    validate(updateTeacherSchema),
    async (req: AuthRequest, res: Response): Promise<void> => {
      try {
        const { id } = req.params;
        const centerId = req.user?.centerId;

        if (!centerId) {
          res.status(403).json({
            success: false,
            message: 'Access denied. User must be associated with a center.',
            errors: ['No center association'],
          });
          return;
        }

        const teacher = await TeacherService.updateTeacher(id, centerId, req.body);
        
        res.status(200).json({
          success: true,
          data: teacher,
          message: 'Teacher updated successfully',
        });
      } catch (error) {
        logger.error('Update teacher failed', { error: error instanceof Error ? error.message : 'Unknown error' });
        
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
          errors: ['Update teacher failed'],
        });
      }
    },
  ];

  static deleteTeacher = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const centerId = req.user?.centerId;

      if (!centerId) {
        res.status(403).json({
          success: false,
          message: 'Access denied. User must be associated with a center.',
          errors: ['No center association'],
        });
        return;
      }

      await TeacherService.deleteTeacher(id, centerId);
      
      res.status(200).json({
        success: true,
        message: 'Teacher deleted successfully',
      });
    } catch (error) {
      logger.error('Delete teacher failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
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
        errors: ['Delete teacher failed'],
      });
    }
  };

  static activateTeacherAccount = [
    async (req: AuthRequest, res: Response): Promise<void> => {
      try {
        const { teacherId } = req.params;
        const centerId = req.user?.centerId;

        if (!centerId) {
          res.status(403).json({
            success: false,
            message: 'Access denied. User must be associated with a center.',
            errors: ['No center association'],
          });
          return;
        }

        const result = await TeacherService.activateTeacherAccount(teacherId, centerId);

        res.status(200).json({
          success: true,
          data: result,
          message: 'Teacher account activated successfully',
        });
      } catch (error) {
        logger.error('Activate teacher account failed', { error: error instanceof Error ? error.message : 'Unknown error' });

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
          errors: ['Activate teacher account failed'],
        });
      }
    },
  ];
}
