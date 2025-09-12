import { Request, Response } from 'express';
import { UserService } from '@/services/userService';
import { validate } from '@/middleware/validation';
import { createUserSchema, updateUserSchema, updateProfileSchema, createCenterAdminSchema } from '@/types/user';
import { logger } from '@/utils/logger';
import { createError } from '@/middleware/errorHandler';
import { AuthenticatedRequest } from '@/types/common';

export class UserController {
  static getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          errors: ['User not authenticated'],
        });
        return;
      }
      
      const user = await UserService.getUserById(userId);
      
      res.status(200).json({
        success: true,
        data: user,
        message: 'Profile retrieved successfully',
      });
    } catch (error) {
      logger.error('Get profile failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
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
        errors: ['Get profile failed'],
      });
    }
  };

  static updateProfile = [
    validate(updateProfileSchema),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const userId = (req as any).user?.userId;
        
        if (!userId) {
          res.status(401).json({
            success: false,
            message: 'Authentication required',
            errors: ['User not authenticated'],
          });
          return;
        }
        
        const user = await UserService.updateUser(userId, req.body);
        
        res.status(200).json({
          success: true,
          data: user,
          message: 'Profile updated successfully',
        });
      } catch (error) {
        logger.error('Update profile failed', { error: error instanceof Error ? error.message : 'Unknown error' });
        
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
          errors: ['Update profile failed'],
        });
      }
    },
  ];

  static getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page, limit, search, sortBy, sortOrder } = req.query;
      
      const pagination = {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
        search: search as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      };
      
      const result = await UserService.getUsers(pagination);
      
      res.status(200).json({
        success: true,
        data: result.users,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
        message: 'Users retrieved successfully',
      });
    } catch (error) {
      logger.error('Get users failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        errors: ['Get users failed'],
      });
    }
  };

  static getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const user = await UserService.getUserById(id);
      
      res.status(200).json({
        success: true,
        data: user,
        message: 'User retrieved successfully',
      });
    } catch (error) {
      logger.error('Get user by ID failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
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
        errors: ['Get user failed'],
      });
    }
  };

  static createUser = [
    validate(createUserSchema),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const user = await UserService.createUser(req.body);
        
        res.status(201).json({
          success: true,
          data: user,
          message: 'User created successfully',
        });
      } catch (error) {
        logger.error('Create user failed', { error: error instanceof Error ? error.message : 'Unknown error' });
        
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
          errors: ['Create user failed'],
        });
      }
    },
  ];

  static updateUser = [
    validate(updateUserSchema),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { id } = req.params;
        const user = await UserService.updateUser(id, req.body);
        
        res.status(200).json({
          success: true,
          data: user,
          message: 'User updated successfully',
        });
      } catch (error) {
        logger.error('Update user failed', { error: error instanceof Error ? error.message : 'Unknown error' });
        
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
          errors: ['Update user failed'],
        });
      }
    },
  ];

  static deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await UserService.deleteUser(id);
      
      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      logger.error('Delete user failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
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
        errors: ['Delete user failed'],
      });
    }
  };

  static suspendUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await UserService.suspendUser(id);

      res.status(200).json({
        success: true,
        data: result,
        message: 'User suspended successfully',
      });
    } catch (error) {
      logger.error('Suspend user failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
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
        errors: ['Suspend user failed'],
      });
    }
  };

  static unsuspendUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await UserService.unsuspendUser(id);

      res.status(200).json({
        success: true,
        data: result,
        message: 'User unsuspended successfully',
      });
    } catch (error) {
      logger.error('Unsuspend user failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
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
        errors: ['Unsuspend user failed'],
      });
    }
  };

  static createCenterAdmin = [
    validate(createCenterAdminSchema),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { centerId } = req.params;
        const adminData = {
          ...req.body,
          role: 'center_admin' as const,
          centerId,
        };
        
        const admin = await UserService.createUser(adminData);
        
        res.status(201).json({
          success: true,
          data: admin,
          message: 'Center admin created successfully',
        });
      } catch (error) {
        logger.error('Create center admin failed', { error: error instanceof Error ? error.message : 'Unknown error' });
        
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
          errors: ['Create center admin failed'],
        });
      }
    },
  ];

  static getCenterAdmins = async (req: Request, res: Response): Promise<void> => {
    try {
      const { centerId } = req.params;
      const { page, limit, search, sortBy, sortOrder } = req.query;
      
      const pagination = {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
        search: search as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      };
      
      const result = await UserService.getCenterAdmins(centerId, pagination);
      
      res.status(200).json({
        success: true,
        data: result.admins,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
        message: 'Center admins retrieved successfully',
      });
    } catch (error) {
      logger.error('Get center admins failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        errors: ['Get center admins failed'],
      });
    }
  };
}
