import { Router } from 'express';
import { authenticate, authorize } from '@/middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Placeholder routes - to be implemented
router.get('/course/:courseId', (req, res) => {
  res.json({ success: true, message: 'Course lessons endpoint - to be implemented' });
});

router.post('/', authorize('TEACHER', 'ADMIN'), (req, res) => {
  res.json({ success: true, message: 'Create lesson endpoint - to be implemented' });
});

export default router;