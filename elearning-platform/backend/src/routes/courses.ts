import { Router } from 'express';
import {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  getMyCourses,
  publishCourse,
} from '@/controllers/courseController';
import { authenticate, authorize, optionalAuth } from '@/middleware/auth';
import { validate, validateParams, validateQuery, schemas } from '@/middleware/validation';

const router = Router();

// Public routes (with optional auth for enrollment status)
router.get('/', validateQuery(schemas.pagination), optionalAuth, getCourses);
router.get('/:id', validateParams(schemas.idParam), optionalAuth, getCourse);

// Protected routes
router.use(authenticate);

// Teacher/Admin routes
router.post('/', 
  authorize('TEACHER', 'ADMIN'), 
  validate(schemas.createCourse), 
  createCourse
);

router.get('/my/courses', 
  authorize('TEACHER', 'ADMIN'),
  validateQuery(schemas.pagination),
  getMyCourses
);

router.put('/:id', 
  authorize('TEACHER', 'ADMIN'),
  validateParams(schemas.idParam),
  validate(schemas.createCourse),
  updateCourse
);

router.delete('/:id', 
  authorize('TEACHER', 'ADMIN'),
  validateParams(schemas.idParam),
  deleteCourse
);

router.patch('/:id/publish', 
  authorize('TEACHER', 'ADMIN'),
  validateParams(schemas.idParam),
  publishCourse
);

export default router;