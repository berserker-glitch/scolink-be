import { Request, Response } from 'express';
import { FieldService } from '@/services/fieldService';
import { createFieldSchema, updateFieldSchema } from '@/types/field';
import { validate } from '@/middleware/validation';
import { logger } from '@/utils/logger';
import { AuthRequest } from '@/types/auth';

export class FieldController {
  static createField = [
    validate(createFieldSchema),
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

        const field = await FieldService.createField(centerId, req.body);
        
        res.status(201).json({
          success: true,
          data: field,
          message: 'Field created successfully',
        });
      } catch (error) {
        logger.error('Create field failed', { error: error instanceof Error ? error.message : 'Unknown error' });
        
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
          errors: ['Create field failed'],
        });
      }
    },
  ];

  static getFields = async (req: AuthRequest, res: Response): Promise<void> => {
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

      const result = await FieldService.getFields(centerId, pagination);
      
      res.status(200).json({
        success: true,
        data: result.fields,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
        message: 'Fields retrieved successfully',
      });
    } catch (error) {
      logger.error('Get fields failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        errors: ['Get fields failed'],
      });
    }
  };

  static getFieldById = async (req: AuthRequest, res: Response): Promise<void> => {
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

      const field = await FieldService.getFieldById(id, centerId);
      
      res.status(200).json({
        success: true,
        data: field,
        message: 'Field retrieved successfully',
      });
    } catch (error) {
      logger.error('Get field failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
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
        errors: ['Get field failed'],
      });
    }
  };

  static getFieldsByYear = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { yearId } = req.params;
      const centerId = req.user?.centerId;

      if (!centerId) {
        res.status(403).json({
          success: false,
          message: 'Access denied. User must be associated with a center.',
          errors: ['No center association'],
        });
        return;
      }

      const fields = await FieldService.getFieldsByYear(yearId, centerId);
      
      res.status(200).json({
        success: true,
        data: fields,
        message: 'Fields retrieved successfully',
      });
    } catch (error) {
      logger.error('Get fields by year failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
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
        errors: ['Get fields by year failed'],
      });
    }
  };

  static updateField = [
    validate(updateFieldSchema),
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

        const field = await FieldService.updateField(id, centerId, req.body);
        
        res.status(200).json({
          success: true,
          data: field,
          message: 'Field updated successfully',
        });
      } catch (error) {
        logger.error('Update field failed', { error: error instanceof Error ? error.message : 'Unknown error' });
        
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
          errors: ['Update field failed'],
        });
      }
    },
  ];

  static deleteField = async (req: AuthRequest, res: Response): Promise<void> => {
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

      await FieldService.deleteField(id, centerId);
      
      res.status(200).json({
        success: true,
        message: 'Field deleted successfully',
      });
    } catch (error) {
      logger.error('Delete field failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
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
        errors: ['Delete field failed'],
      });
    }
  };
}
