import { Router } from 'express';
import { PrismaClient, PaymentStatus } from '@prisma/client';
import Stripe from 'stripe';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { createError } from '../middleware/errorHandler';
import { config } from '../config';
import { sendEmail } from '../services/email';

const router = Router();
const prisma = new PrismaClient();
const stripe = new Stripe(config.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Validation schemas
const createPaymentIntentSchema = z.object({
  body: z.object({
    courseId: z.string(),
  }),
});

/**
 * @swagger
 * /api/payments/create-intent:
 *   post:
 *     summary: Create payment intent for course enrollment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseId
 *             properties:
 *               courseId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment intent created successfully
 *       400:
 *         description: Invalid course or already enrolled
 */
router.post(
  '/create-intent',
  authenticate,
  validate(createPaymentIntentSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const { courseId } = req.body;

      // Get course
      const course = await prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        throw createError('Course not found', 404);
      }

      // Check if already enrolled
      const existingEnrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: req.user!.id,
            courseId,
          },
        },
      });

      if (existingEnrollment) {
        throw createError('Already enrolled in this course', 400);
      }

      // Check if payment already exists
      const existingPayment = await prisma.payment.findFirst({
        where: {
          userId: req.user!.id,
          courseId,
          status: PaymentStatus.PENDING,
        },
      });

      if (existingPayment) {
        return res.json({
          clientSecret: existingPayment.stripePaymentIntentId,
          paymentId: existingPayment.id,
        });
      }

      // Create Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(course.price * 100), // Convert to cents
        currency: 'usd',
        metadata: {
          userId: req.user!.id,
          courseId,
        },
      });

      // Create payment record
      const payment = await prisma.payment.create({
        data: {
          userId: req.user!.id,
          courseId,
          amount: course.price,
          status: PaymentStatus.PENDING,
          stripePaymentIntentId: paymentIntent.id,
        },
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentId: payment.id,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/payments/create-checkout-session:
 *   post:
 *     summary: Create Stripe checkout session
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseId
 *             properties:
 *               courseId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Checkout session created successfully
 */
router.post(
  '/create-checkout-session',
  authenticate,
  validate(createPaymentIntentSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const { courseId } = req.body;

      // Get course
      const course = await prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        throw createError('Course not found', 404);
      }

      // Check if already enrolled
      const existingEnrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: req.user!.id,
            courseId,
          },
        },
      });

      if (existingEnrollment) {
        throw createError('Already enrolled in this course', 400);
      }

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: course.title,
                description: course.description,
              },
              unit_amount: Math.round(course.price * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${config.FRONTEND_URL}/courses/${courseId}?payment=success`,
        cancel_url: `${config.FRONTEND_URL}/courses/${courseId}?payment=cancelled`,
        metadata: {
          userId: req.user!.id,
          courseId,
        },
      });

      // Create payment record
      const payment = await prisma.payment.create({
        data: {
          userId: req.user!.id,
          courseId,
          amount: course.price,
          status: PaymentStatus.PENDING,
          stripeSessionId: session.id,
        },
      });

      res.json({
        sessionId: session.id,
        url: session.url,
        paymentId: payment.id,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     summary: Stripe webhook handler
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 */
router.post('/webhook', async (req, res, next) => {
  try {
    const sig = req.headers['stripe-signature'] as string;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, config.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return res.status(400).send('Webhook signature verification failed');
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    next(error);
  }
});

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const { userId, courseId } = paymentIntent.metadata;

  // Update payment status
  await prisma.payment.updateMany({
    where: {
      stripePaymentIntentId: paymentIntent.id,
    },
    data: {
      status: PaymentStatus.COMPLETED,
    },
  });

  // Create enrollment
  await prisma.enrollment.create({
    data: {
      userId,
      courseId,
    },
  });

  // Send confirmation email
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (user && course) {
    await sendEmail({
      to: user.email,
      subject: 'Course Enrollment Confirmation',
      html: `
        <h2>Welcome to ${course.title}!</h2>
        <p>Hi ${user.firstName},</p>
        <p>You have successfully enrolled in the course "${course.title}".</p>
        <p>You can now access all course materials and start learning!</p>
        <p>Best regards,<br>The E-Learning Team</p>
      `,
    });
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const { userId, courseId } = session.metadata!;

  // Update payment status
  await prisma.payment.updateMany({
    where: {
      stripeSessionId: session.id,
    },
    data: {
      status: PaymentStatus.COMPLETED,
    },
  });

  // Create enrollment
  await prisma.enrollment.create({
    data: {
      userId,
      courseId,
    },
  });

  // Send confirmation email
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (user && course) {
    await sendEmail({
      to: user.email,
      subject: 'Course Enrollment Confirmation',
      html: `
        <h2>Welcome to ${course.title}!</h2>
        <p>Hi ${user.firstName},</p>
        <p>You have successfully enrolled in the course "${course.title}".</p>
        <p>You can now access all course materials and start learning!</p>
        <p>Best regards,<br>The E-Learning Team</p>
      `,
    });
  }
}

/**
 * @swagger
 * /api/payments/history:
 *   get:
 *     summary: Get user's payment history
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment history retrieved
 */
router.get('/history', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { userId: req.user!.id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(payments);
  } catch (error) {
    next(error);
  }
});

export { router as paymentRoutes };