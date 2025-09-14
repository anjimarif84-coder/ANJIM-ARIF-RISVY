import { Router } from 'express';
import { stripeService } from '@/services/stripeService';
import { authenticate } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';

const router = Router();

// Stripe webhook (no auth required)
router.post('/webhook', 
  asyncHandler(async (req, res) => {
    const signature = req.headers['stripe-signature'] as string;
    await stripeService.handleWebhook(req.body, signature);
    res.json({ received: true });
  })
);

// All other routes require authentication
router.use(authenticate);

// Placeholder routes - to be implemented
router.post('/create-checkout-session', (req, res) => {
  res.json({ success: true, message: 'Create checkout session endpoint - to be implemented' });
});

router.get('/my', (req, res) => {
  res.json({ success: true, message: 'My payments endpoint - to be implemented' });
});

export default router;