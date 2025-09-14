import { Router } from 'express';
import { authenticate } from '@/middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Placeholder routes - to be implemented
router.get('/my', (req, res) => {
  res.json({ success: true, message: 'My enrollments endpoint - to be implemented' });
});

router.post('/:courseId', (req, res) => {
  res.json({ success: true, message: 'Enroll in course endpoint - to be implemented' });
});

export default router;