import { Router } from 'express';
import { authenticate, authorize } from '@/middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Placeholder routes - to be implemented
router.get('/', authorize('ADMIN'), (req, res) => {
  res.json({ success: true, message: 'Users endpoint - to be implemented' });
});

export default router;