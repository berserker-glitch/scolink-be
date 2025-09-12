import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '@/utils/jwt';
import { AuthenticatedRequest } from '@/types/common';
import { logger } from '@/utils/logger';

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Access token required',
        errors: ['Authorization header missing or invalid'],
      });
      return;
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    
    (req as any).user = payload;
    next();
  } catch (error) {
    logger.error('Authentication failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    
    res.status(401).json({
      success: false,
      message: 'Invalid or expired access token',
      errors: ['Authentication failed'],
    });
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        errors: ['User not authenticated'],
      });
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      logger.warn('Unauthorized access attempt', {
        userId: user.userId,
        userRole: user.role,
        requiredRoles: allowedRoles,
        endpoint: req.path,
      });
      
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        errors: ['Access denied'],
      });
      return;
    }

    next();
  };
};

export const requireSuperAdmin = requireRole(['super_admin']);
export const requireAdmin = requireRole(['super_admin', 'center_admin']);
