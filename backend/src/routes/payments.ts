import { Router } from 'express';
import { PaymentService } from '../services/paymentService';
import { authenticateToken, requireStudent, requireTeacher } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Create payment intent
router.post('/create-payment-intent', authenticateToken, requireStudent, validate(schemas.payment), asyncHandler(async (req, res) => {
  const { clientSecret, sessionId } = await PaymentService.createPaymentIntent(req.body, req.user!.id);
  
  res.json({
    success: true,
    data: { clientSecret, sessionId },
    message: 'Payment intent created successfully',
  });
}));

// Stripe webhook
router.post('/webhook', asyncHandler(async (req, res) => {
  const signature = req.headers['stripe-signature'] as string;
  
  if (!signature) {
    return res.status(400).json({
      success: false,
      error: 'Missing Stripe signature',
    });
  }

  await PaymentService.handleWebhook(JSON.stringify(req.body), signature);
  
  res.json({ received: true });
}));

// Get user's payments
router.get('/my-payments', authenticateToken, requireStudent, asyncHandler(async (req, res) => {
  const payments = await PaymentService.getUserPayments(req.user!.id);
  
  res.json({
    success: true,
    data: payments,
  });
}));

// Refund payment (instructor only)
router.post('/:paymentId/refund', authenticateToken, requireTeacher, asyncHandler(async (req, res) => {
  await PaymentService.refundPayment(req.params.paymentId, req.user!.id);
  
  res.json({
    success: true,
    message: 'Payment refunded successfully',
  });
}));

export { router as paymentRoutes };