import { Router } from 'express';
import { EventController } from '../controllers/eventController';
import { authenticate, requireStaffAccess } from '../middleware/auth';
import { requireEventsAccess } from '../middleware/planRestrictions';
import { validate } from '../middleware/validation';
import { 
  createEventSchema, 
  updateEventSchema, 
  enrollStudentInEventSchema,
  enrollStudentsInEventSchema 
} from '../types/event';

const router = Router();

// All event routes require authentication, staff access, and events access
router.use(authenticate, requireStaffAccess);
router.use(requireEventsAccess);

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
