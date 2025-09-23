import { Request, Response } from 'express';
import { AuthService } from '@/services/authService';
import { validate } from '@/middleware/validation';
import { loginSchema, refreshTokenSchema, signupSchema, AuthRequest } from '@/types/auth';
import { logger } from '@/utils/logger';
import { createError } from '@/middleware/errorHandler';

export class AuthController {
  static login = [
    validate(loginSchema),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const result = await AuthService.login(req.body);
        
        res.status(200).json({
          success: true,
          data: result,
          message: 'Login successful',
        });
      } catch (error) {
        logger.error('Login failed', { error: error instanceof Error ? error.message : 'Unknown error' });
        
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
          errors: ['Login failed'],
        });
      }
    },
  ];

  static signup = [
    validate(signupSchema),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const result = await AuthService.signup(req.body);
        
        res.status(201).json({
          success: true,
          data: result,
          message: 'Registration successful',
        });
      } catch (error) {
        logger.error('Signup failed', { error: error instanceof Error ? error.message : 'Unknown error' });
        
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
          errors: ['Registration failed'],
        });
      }
    },
  ];

  static refreshToken = [
    validate(refreshTokenSchema),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { refreshToken } = req.body;
        const result = await AuthService.refreshToken(refreshToken);
        
        res.status(200).json({
          success: true,
          data: result,
          message: 'Token refreshed successfully',
        });
      } catch (error) {
        logger.error('Token refresh failed', { error: error instanceof Error ? error.message : 'Unknown error' });
        
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
          errors: ['Token refresh failed'],
        });
      }
    },
  ];

  static logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      
      if (refreshToken) {
        await AuthService.logout(refreshToken);
      }
      
      res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      logger.error('Logout failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        errors: ['Logout failed'],
      });
    }
  };

  static logoutAll = async (req: Request, res: Response): Promise<void> => {
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
      
      await AuthService.logoutAllSessions(userId);
      
      res.status(200).json({
        success: true,
        message: 'All sessions logged out successfully',
      });
    } catch (error) {
      logger.error('Logout all failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
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
        errors: ['Logout all failed'],
      });
    }
  };

  static getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
          errors: ['Authentication required'],
        });
        return;
      }

      const user = await AuthService.getUserProfile(req.user.userId);
      
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
}
