import Stripe from 'stripe';
import { PrismaClient, Payment, Course } from '@prisma/client';
import { PaymentRequest } from '../types';
import { createError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export class PaymentService {
  private static stripe: Stripe;

  static initialize() {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });
  }

  static async createPaymentIntent(data: PaymentRequest, userId: string): Promise<{ clientSecret: string; sessionId: string }> {
    if (!this.stripe) {
      this.initialize();
    }

    // Get course details
    const course = await prisma.course.findUnique({
      where: { id: data.courseId },
    });

    if (!course) {
      throw createError('Course not found', 404);
    }

    if (course.status !== 'PUBLISHED') {
      throw createError('Course is not available for purchase', 400);
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: data.courseId,
        },
      },
    });

    if (existingEnrollment) {
      throw createError('Already enrolled in this course', 409);
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId,
        courseId: data.courseId,
        amount: course.price,
        currency: 'usd',
        status: 'PENDING',
      },
    });

    // Create Stripe checkout session
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: course.title,
              description: course.description,
            },
            unit_amount: Math.round(course.price.toNumber() * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: data.successUrl || `${process.env.FRONTEND_URL}/courses/${course.id}?payment=success`,
      cancel_url: data.cancelUrl || `${process.env.FRONTEND_URL}/courses/${course.id}?payment=cancelled`,
      metadata: {
        paymentId: payment.id,
        userId,
        courseId: data.courseId,
      },
      customer_email: (await prisma.user.findUnique({ where: { id: userId } }))?.email,
    });

    // Update payment with session ID
    await prisma.payment.update({
      where: { id: payment.id },
      data: { stripeSessionId: session.id },
    });

    return {
      clientSecret: session.payment_intent as string,
      sessionId: session.id,
    };
  }

  static async handleWebhook(payload: string, signature: string): Promise<void> {
    if (!this.stripe) {
      this.initialize();
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET not configured');
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      throw createError('Invalid webhook signature', 400);
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  private static async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const paymentId = session.metadata?.paymentId;
    if (!paymentId) {
      console.error('No payment ID in session metadata');
      return;
    }

    // Update payment status
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'COMPLETED',
        stripePaymentId: session.payment_intent as string,
      },
    });

    // Create enrollment
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (payment) {
      await prisma.enrollment.create({
        data: {
          userId: payment.userId,
          courseId: payment.courseId,
          status: 'ACTIVE',
        },
      });

      // Create notification
      await prisma.notification.create({
        data: {
          userId: payment.userId,
          title: 'Enrollment Successful',
          message: 'You have been successfully enrolled in the course!',
          type: 'success',
        },
      });
    }
  }

  private static async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    // Find payment by Stripe payment intent ID
    const payment = await prisma.payment.findFirst({
      where: { stripePaymentId: paymentIntent.id },
    });

    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'COMPLETED' },
      });
    }
  }

  private static async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    // Find payment by Stripe payment intent ID
    const payment = await prisma.payment.findFirst({
      where: { stripePaymentId: paymentIntent.id },
    });

    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });

      // Create notification
      await prisma.notification.create({
        data: {
          userId: payment.userId,
          title: 'Payment Failed',
          message: 'Your payment could not be processed. Please try again.',
          type: 'error',
        },
      });
    }
  }

  static async getUserPayments(userId: string): Promise<Payment[]> {
    const payments = await prisma.payment.findMany({
      where: { userId },
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

    return payments;
  }

  static async refundPayment(paymentId: string, instructorId: string): Promise<void> {
    if (!this.stripe) {
      this.initialize();
    }

    // Get payment with course details
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        course: true,
      },
    });

    if (!payment) {
      throw createError('Payment not found', 404);
    }

    // Check if instructor owns the course
    if (payment.course.instructorId !== instructorId) {
      throw createError('Not authorized to refund this payment', 403);
    }

    if (payment.status !== 'COMPLETED') {
      throw createError('Can only refund completed payments', 400);
    }

    if (!payment.stripePaymentId) {
      throw createError('No Stripe payment ID found', 400);
    }

    // Create refund in Stripe
    await this.stripe.refunds.create({
      payment_intent: payment.stripePaymentId,
    });

    // Update payment status
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'REFUNDED' },
    });

    // Cancel enrollment
    await prisma.enrollment.updateMany({
      where: {
        userId: payment.userId,
        courseId: payment.courseId,
      },
      data: { status: 'CANCELLED' },
    });
  }
}