import { Response } from 'express';
import { EventService } from '../services/eventService';
import { logger } from '../utils/logger';
import { AuthRequest } from '../types/auth';

export class EventController {
  static createEvent = async (req: AuthRequest, res: Response): Promise<void> => {
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

      const event = await EventService.createEvent(centerId, req.body);
      
      res.status(201).json({
        success: true,
        data: event,
        message: 'Event created successfully',
      });
    } catch (error) {
      logger.error('Create event failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
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
        errors: ['Create event failed'],
      });
    }
  };

  static getEvents = async (req: AuthRequest, res: Response): Promise<void> => {
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

      const result = await EventService.getEvents(centerId, pagination);
      
      res.status(200).json({
        success: true,
        data: result.events,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
        message: 'Events retrieved successfully',
      });
    } catch (error) {
      logger.error('Get events failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        errors: ['Get events failed'],
      });
    }
  };

  static getEventById = async (req: AuthRequest, res: Response): Promise<void> => {
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

      const event = await EventService.getEventById(id, centerId);
      
      res.status(200).json({
        success: true,
        data: event,
        message: 'Event retrieved successfully',
      });
    } catch (error) {
      logger.error('Get event failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
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
        errors: ['Get event failed'],
      });
    }
  };

  static updateEvent = async (req: AuthRequest, res: Response): Promise<void> => {
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

      const event = await EventService.updateEvent(id, centerId, req.body);
      
      res.status(200).json({
        success: true,
        data: event,
        message: 'Event updated successfully',
      });
    } catch (error) {
      logger.error('Update event failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
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
        errors: ['Update event failed'],
      });
    }
  };

  static deleteEvent = async (req: AuthRequest, res: Response): Promise<void> => {
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

      await EventService.deleteEvent(id, centerId);
      
      res.status(200).json({
        success: true,
        message: 'Event deleted successfully',
      });
    } catch (error) {
      logger.error('Delete event failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
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
        errors: ['Delete event failed'],
      });
    }
  };

  static enrollStudentInEvent = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { studentId } = req.body;
      const centerId = req.user?.centerId;

      if (!centerId) {
        res.status(403).json({
          success: false,
          message: 'Access denied. User must be associated with a center.',
          errors: ['No center association'],
        });
        return;
      }

      await EventService.enrollStudentInEvent(id, studentId, centerId);
      
      res.status(200).json({
        success: true,
        message: 'Student enrolled in event successfully',
      });
    } catch (error) {
      logger.error('Enroll student in event failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
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
        errors: ['Enroll student in event failed'],
      });
    }
  };

  static unenrollStudentFromEvent = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id, studentId } = req.params;
      const centerId = req.user?.centerId;

      if (!centerId) {
        res.status(403).json({
          success: false,
          message: 'Access denied. User must be associated with a center.',
          errors: ['No center association'],
        });
        return;
      }

      await EventService.unenrollStudentFromEvent(id, studentId, centerId);
      
      res.status(200).json({
        success: true,
        message: 'Student unenrolled from event successfully',
      });
    } catch (error) {
      logger.error('Unenroll student from event failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
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
        errors: ['Unenroll student from event failed'],
      });
    }
  };

  static bulkEnrollStudentsInEvent = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { studentIds } = req.body;
      const centerId = req.user?.centerId;

      if (!centerId) {
        res.status(403).json({
          success: false,
          message: 'Access denied. User must be associated with a center.',
          errors: ['No center association'],
        });
        return;
      }

      await EventService.bulkEnrollStudentsInEvent(id, studentIds, centerId);
      
      res.status(200).json({
        success: true,
        message: 'Students enrolled in event successfully',
      });
    } catch (error) {
      logger.error('Bulk enroll students in event failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
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
        errors: ['Bulk enroll students in event failed'],
      });
    }
  };
}
