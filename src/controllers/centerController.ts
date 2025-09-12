import { Request, Response } from 'express';
import { CenterService } from '@/services/centerService';
import { validate } from '@/middleware/validation';
import { createCenterSchema, updateCenterSchema } from '@/types/center';
import { logger } from '@/utils/logger';
import { createError } from '@/middleware/errorHandler';
import { AuthenticatedRequest } from '@/types/common';

export class CenterController {
  static createCenter = [
    validate(createCenterSchema),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const createdBy = (req as any).user?.userId;
        
        if (!createdBy) {
          res.status(401).json({
            success: false,
            message: 'Authentication required',
            errors: ['User not authenticated'],
          });
          return;
        }
        
        const center = await CenterService.createCenter(req.body, createdBy);
        
        res.status(201).json({
          success: true,
          data: center,
          message: 'Center created successfully',
        });
      } catch (error) {
        logger.error('Create center failed', { error: error instanceof Error ? error.message : 'Unknown error' });
        
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
          errors: ['Create center failed'],
        });
      }
    },
  ];

  static getCenters = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page, limit, search, sortBy, sortOrder } = req.query;
      
      const pagination = {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
        search: search as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      };
      
      const result = await CenterService.getCenters(pagination);
      
      res.status(200).json({
        success: true,
        data: result.centers,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
        message: 'Centers retrieved successfully',
      });
    } catch (error) {
      logger.error('Get centers failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        errors: ['Get centers failed'],
      });
    }
  };

  static getCenterById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const center = await CenterService.getCenterById(id);
      
      res.status(200).json({
        success: true,
        data: center,
        message: 'Center retrieved successfully',
      });
    } catch (error) {
      logger.error('Get center by ID failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
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
        errors: ['Get center failed'],
      });
    }
  };

  static getCenterWithAdmins = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const center = await CenterService.getCenterWithAdmins(id);
      
      res.status(200).json({
        success: true,
        data: center,
        message: 'Center with admins retrieved successfully',
      });
    } catch (error) {
      logger.error('Get center with admins failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
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
        errors: ['Get center with admins failed'],
      });
    }
  };

  static updateCenter = [
    validate(updateCenterSchema),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { id } = req.params;
        const center = await CenterService.updateCenter(id, req.body);
        
        res.status(200).json({
          success: true,
          data: center,
          message: 'Center updated successfully',
        });
      } catch (error) {
        logger.error('Update center failed', { error: error instanceof Error ? error.message : 'Unknown error' });
        
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
          errors: ['Update center failed'],
        });
      }
    },
  ];

  static deleteCenter = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      // Delete center and cascade delete admin users
      await CenterService.deleteCenterWithAdmins(id);
      
      res.status(200).json({
        success: true,
        message: 'Center and associated admin users deleted successfully',
      });
    } catch (error) {
      logger.error('Delete center failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
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
        errors: ['Delete center failed'],
      });
    }
  };

  static suspendCenter = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await CenterService.suspendCenter(id);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Center suspended successfully',
      });
    } catch (error) {
      logger.error('Suspend center failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
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
        errors: ['Suspend center failed'],
      });
    }
  };

  static unsuspendCenter = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await CenterService.unsuspendCenter(id);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Center unsuspended successfully',
      });
    } catch (error) {
      logger.error('Unsuspend center failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
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
        errors: ['Unsuspend center failed'],
      });
    }
  };
}
