import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { logger } from '@/utils/logger';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        
        logger.warn('Validation failed', {
          errors,
          body: req.body,
          path: req.path,
        });
        
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors,
        });
        return;
      }
      
      logger.error('Validation middleware error', { error });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        errors: ['Validation failed'],
      });
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        
        logger.warn('Query validation failed', {
          errors,
          query: req.query,
          path: req.path,
        });
        
        res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors,
        });
        return;
      }
      
      logger.error('Query validation middleware error', { error });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        errors: ['Query validation failed'],
      });
    }
  };
};
