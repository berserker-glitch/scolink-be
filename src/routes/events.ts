import { Router } from 'express';
import { EventController } from '../controllers/eventController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { 
  createEventSchema, 
  updateEventSchema, 
  enrollStudentInEventSchema,
  enrollStudentsInEventSchema 
} from '../types/event';

const router = Router();

// All event routes require authentication and admin privileges
router.use(authenticate, requireAdmin);

// Event CRUD routes
router.post('/', validate(createEventSchema), EventController.createEvent);
router.get('/', EventController.getEvents);
router.get('/:id', EventController.getEventById);
router.put('/:id', validate(updateEventSchema), EventController.updateEvent);
router.delete('/:id', EventController.deleteEvent);

// Event enrollment routes
router.post('/:id/enroll', validate(enrollStudentInEventSchema), EventController.enrollStudentInEvent);
router.delete('/:id/students/:studentId', EventController.unenrollStudentFromEvent);
router.post('/:id/enroll-bulk', validate(enrollStudentsInEventSchema), EventController.bulkEnrollStudentsInEvent);

export default router;
