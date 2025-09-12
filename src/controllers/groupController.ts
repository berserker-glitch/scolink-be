import { Request, Response } from 'express';
import { GroupService } from '@/services/groupService';
import { createGroupSchema, updateGroupSchema } from '@/types/group';
import { validate } from '@/middleware/validation';
import { logger } from '@/utils/logger';
import { AuthRequest } from '@/types/auth';

export class GroupController {
  static createGroup = [
    validate(createGroupSchema),
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

        const group = await GroupService.createGroup(centerId, req.body);
        
        res.status(201).json({
          success: true,
          data: group,
          message: 'Group created successfully',
        });
      } catch (error) {
        logger.error('Create group failed', { error: error instanceof Error ? error.message : 'Unknown error' });
        
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
          errors: ['Create group failed'],
        });
      }
    },
  ];

  static getGroups = async (req: AuthRequest, res: Response): Promise<void> => {
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

      const result = await GroupService.getGroups(centerId, pagination);
      
      res.status(200).json({
        success: true,
        data: result.groups,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
        message: 'Groups retrieved successfully',
      });
    } catch (error) {
      logger.error('Get groups failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        errors: ['Get groups failed'],
      });
    }
  };

  static getGroupById = async (req: AuthRequest, res: Response): Promise<void> => {
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

      const group = await GroupService.getGroupById(id, centerId);
      
      res.status(200).json({
        success: true,
        data: group,
        message: 'Group retrieved successfully',
      });
    } catch (error) {
      logger.error('Get group failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
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
        errors: ['Get group failed'],
      });
    }
  };

  static getGroupWithDetails = async (req: AuthRequest, res: Response): Promise<void> => {
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

      const group = await GroupService.getGroupWithDetails(id, centerId);
      
      res.status(200).json({
        success: true,
        data: group,
        message: 'Group with details retrieved successfully',
      });
    } catch (error) {
      logger.error('Get group with details failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
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
        errors: ['Get group with details failed'],
      });
    }
  };

  static getGroupsBySubject = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { subjectId } = req.params;
      const centerId = req.user?.centerId;

      if (!centerId) {
        res.status(403).json({
          success: false,
          message: 'Access denied. User must be associated with a center.',
          errors: ['No center association'],
        });
        return;
      }

      const groups = await GroupService.getGroupsBySubject(subjectId, centerId);
      
      res.status(200).json({
        success: true,
        data: groups,
        message: 'Groups retrieved successfully',
      });
    } catch (error) {
      logger.error('Get groups by subject failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
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
        errors: ['Get groups by subject failed'],
      });
    }
  };

  static updateGroup = [
    validate(updateGroupSchema),
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

        const group = await GroupService.updateGroup(id, centerId, req.body);
        
        res.status(200).json({
          success: true,
          data: group,
          message: 'Group updated successfully',
        });
      } catch (error) {
        logger.error('Update group failed', { error: error instanceof Error ? error.message : 'Unknown error' });
        
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
          errors: ['Update group failed'],
        });
      }
    },
  ];

  static deleteGroup = async (req: AuthRequest, res: Response): Promise<void> => {
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

      await GroupService.deleteGroup(id, centerId);
      
      res.status(200).json({
        success: true,
        message: 'Group deleted successfully',
      });
    } catch (error) {
      logger.error('Delete group failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
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
        errors: ['Delete group failed'],
      });
    }
  };

  static getGroupStudents = async (req: AuthRequest, res: Response): Promise<void> => {
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

      const students = await GroupService.getGroupStudents(id, centerId);
      
      res.status(200).json({
        success: true,
        data: students,
        message: 'Group students retrieved successfully',
      });
    } catch (error) {
      logger.error('Get group students failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
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
        errors: ['Get group students failed'],
      });
    }
  };
}
