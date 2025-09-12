import { Request, Response } from 'express';
import { SubjectService } from '@/services/subjectService';
import { createSubjectSchema, updateSubjectSchema } from '@/types/subject';
import { validate } from '@/middleware/validation';
import { logger } from '@/utils/logger';
import { AuthRequest } from '@/types/auth';

export class SubjectController {
  static createSubject = [
    validate(createSubjectSchema),
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

        const subject = await SubjectService.createSubject(centerId, req.body);
        
        res.status(201).json({
          success: true,
          data: subject,
          message: 'Subject created successfully',
        });
      } catch (error) {
        logger.error('Create subject failed', { error: error instanceof Error ? error.message : 'Unknown error' });
        
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
          errors: ['Create subject failed'],
        });
      }
    },
  ];

  static getSubjects = async (req: AuthRequest, res: Response): Promise<void> => {
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

      const result = await SubjectService.getSubjects(centerId, pagination);
      
      res.status(200).json({
        success: true,
        data: result.subjects,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
        message: 'Subjects retrieved successfully',
      });
    } catch (error) {
      logger.error('Get subjects failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        errors: ['Get subjects failed'],
      });
    }
  };

  static getSubjectById = async (req: AuthRequest, res: Response): Promise<void> => {
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

      const subject = await SubjectService.getSubjectById(id, centerId);
      
      res.status(200).json({
        success: true,
        data: subject,
        message: 'Subject retrieved successfully',
      });
    } catch (error) {
      logger.error('Get subject failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
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
        errors: ['Get subject failed'],
      });
    }
  };

  static getSubjectWithGroups = async (req: AuthRequest, res: Response): Promise<void> => {
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

      const subject = await SubjectService.getSubjectWithGroups(id, centerId);
      
      res.status(200).json({
        success: true,
        data: subject,
        message: 'Subject with groups retrieved successfully',
      });
    } catch (error) {
      logger.error('Get subject with groups failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
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
        errors: ['Get subject with groups failed'],
      });
    }
  };

  static getSubjectsByField = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { fieldId } = req.params;
      const centerId = req.user?.centerId;

      if (!centerId) {
        res.status(403).json({
          success: false,
          message: 'Access denied. User must be associated with a center.',
          errors: ['No center association'],
        });
        return;
      }

      const subjects = await SubjectService.getSubjectsByField(fieldId, centerId);
      
      res.status(200).json({
        success: true,
        data: subjects,
        message: 'Subjects retrieved successfully',
      });
    } catch (error) {
      logger.error('Get subjects by field failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
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
        errors: ['Get subjects by field failed'],
      });
    }
  };

  static updateSubject = [
    validate(updateSubjectSchema),
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

        const subject = await SubjectService.updateSubject(id, centerId, req.body);
        
        res.status(200).json({
          success: true,
          data: subject,
          message: 'Subject updated successfully',
        });
      } catch (error) {
        logger.error('Update subject failed', { error: error instanceof Error ? error.message : 'Unknown error' });
        
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
          errors: ['Update subject failed'],
        });
      }
    },
  ];

  static deleteSubject = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { cascade } = req.query;
      const centerId = req.user?.centerId;

      if (!centerId) {
        res.status(403).json({
          success: false,
          message: 'Access denied. User must be associated with a center.',
          errors: ['No center association'],
        });
        return;
      }

      if (cascade === 'true') {
        await SubjectService.deleteSubjectWithGroups(id, centerId);
      } else {
        await SubjectService.deleteSubject(id, centerId);
      }
      
      res.status(200).json({
        success: true,
        message: cascade === 'true' 
          ? 'Subject and associated groups deleted successfully'
          : 'Subject deleted successfully',
      });
    } catch (error) {
      logger.error('Delete subject failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
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
        errors: ['Delete subject failed'],
      });
    }
  };
}
