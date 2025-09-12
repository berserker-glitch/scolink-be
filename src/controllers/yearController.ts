import { Request, Response } from 'express';
import { YearService } from '@/services/yearService';
import { createYearSchema, updateYearSchema } from '@/types/year';
import { validate } from '@/middleware/validation';
import { logger } from '@/utils/logger';
import { AuthRequest } from '@/types/auth';

export class YearController {
  static createYear = [
    validate(createYearSchema),
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

        const year = await YearService.createYear(centerId, req.body);
        
        res.status(201).json({
          success: true,
          data: year,
          message: 'Year created successfully',
        });
      } catch (error) {
        logger.error('Create year failed', { error: error instanceof Error ? error.message : 'Unknown error' });
        
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
          errors: ['Create year failed'],
        });
      }
    },
  ];

  static getYears = async (req: AuthRequest, res: Response): Promise<void> => {
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

      const result = await YearService.getYears(centerId, pagination);
      
      res.status(200).json({
        success: true,
        data: result.years,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
        message: 'Years retrieved successfully',
      });
    } catch (error) {
      logger.error('Get years failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        errors: ['Get years failed'],
      });
    }
  };

  static getYearById = async (req: AuthRequest, res: Response): Promise<void> => {
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

      const year = await YearService.getYearById(id, centerId);
      
      res.status(200).json({
        success: true,
        data: year,
        message: 'Year retrieved successfully',
      });
    } catch (error) {
      logger.error('Get year failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
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
        errors: ['Get year failed'],
      });
    }
  };

  static getYearWithFields = async (req: AuthRequest, res: Response): Promise<void> => {
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

      const year = await YearService.getYearWithFields(id, centerId);
      
      res.status(200).json({
        success: true,
        data: year,
        message: 'Year with fields retrieved successfully',
      });
    } catch (error) {
      logger.error('Get year with fields failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
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
        errors: ['Get year with fields failed'],
      });
    }
  };

  static updateYear = [
    validate(updateYearSchema),
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

        const year = await YearService.updateYear(id, centerId, req.body);
        
        res.status(200).json({
          success: true,
          data: year,
          message: 'Year updated successfully',
        });
      } catch (error) {
        logger.error('Update year failed', { error: error instanceof Error ? error.message : 'Unknown error' });
        
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
          errors: ['Update year failed'],
        });
      }
    },
  ];

  static deleteYear = async (req: AuthRequest, res: Response): Promise<void> => {
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
        await YearService.deleteYearWithFields(id, centerId);
      } else {
        await YearService.deleteYear(id, centerId);
      }
      
      res.status(200).json({
        success: true,
        message: cascade === 'true' 
          ? 'Year and associated fields deleted successfully'
          : 'Year deleted successfully',
      });
    } catch (error) {
      logger.error('Delete year failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
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
        errors: ['Delete year failed'],
      });
    }
  };
}
