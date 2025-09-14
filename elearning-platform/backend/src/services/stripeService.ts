import Stripe from 'stripe';
import { prisma } from '../index';
import { logger } from '@/utils/logger';
import { StripeCheckoutSession } from '@/types';

class StripeService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
    });
  }

  async createCheckoutSession(
    userId: string,
    courseId: string,
    courseName: string,
    coursePrice: number
  ): Promise<StripeCheckoutSession> {
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: courseName,
                description: `Access to the complete ${courseName} course`,
              },
              unit_amount: Math.round(coursePrice * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/courses/${courseId}?payment=success`,
        cancel_url: `${process.env.FRONTEND_URL}/courses/${courseId}?payment=cancelled`,
        metadata: {
          userId,
          courseId,
        },
        customer_email: undefined, // Will be filled by Stripe Checkout
      });

      // Store payment record
      await prisma.payment.create({
        data: {
          userId,
          courseId,
          stripeSessionId: session.id,
          amount: coursePrice,
          currency: 'usd',
          status: 'PENDING',
        },
      });

      logger.info(`Checkout session created: ${session.id} for user ${userId}, course ${courseId}`);

      return {
        sessionId: session.id,
        url: session.url!,
      };
    } catch (error) {
      logger.error('Error creating checkout session:', error);
      throw error;
    }
  }

  async handleWebhook(payload: string, signature: string): Promise<void> {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (error) {
      logger.error('Webhook signature verification failed:', error);
      throw new Error('Webhook signature verification failed');
    }

    logger.info(`Received Stripe webhook: ${event.type}`);

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
        logger.info(`Unhandled webhook event type: ${event.type}`);
    }
  }

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
    try {
      const { userId, courseId } = session.metadata!;

      // Update payment status
      await prisma.payment.update({
        where: { stripeSessionId: session.id },
        data: {
          status: 'COMPLETED',
          stripePaymentId: session.payment_intent as string,
        },
      });

      // Create enrollment
      await prisma.enrollment.create({
        data: {
          userId,
          courseId,
          status: 'ACTIVE',
        },
      });

      // Get course and user details for email
      const [course, user] = await Promise.all([
        prisma.course.findUnique({
          where: { id: courseId },
          select: { title: true },
        }),
        prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, firstName: true },
        }),
      ]);

      // Send enrollment confirmation email
      if (course && user) {
        const { emailService } = await import('./emailService');
        await emailService.sendEnrollmentConfirmation(
          user.email,
          user.firstName,
          course.title,
          courseId
        );
      }

      logger.info(`Enrollment created for user ${userId} in course ${courseId}`);
    } catch (error) {
      logger.error('Error handling checkout session completed:', error);
      throw error;
    }
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      // Additional processing if needed
      logger.info(`Payment intent succeeded: ${paymentIntent.id}`);
    } catch (error) {
      logger.error('Error handling payment intent succeeded:', error);
      throw error;
    }
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      // Update payment status to failed
      await prisma.payment.updateMany({
        where: { stripePaymentId: paymentIntent.id },
        data: { status: 'FAILED' },
      });

      logger.info(`Payment intent failed: ${paymentIntent.id}`);
    } catch (error) {
      logger.error('Error handling payment intent failed:', error);
      throw error;
    }
  }

  async createRefund(paymentIntentId: string, amount?: number): Promise<Stripe.Refund> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount,
      });

      // Update payment status
      await prisma.payment.updateMany({
        where: { stripePaymentId: paymentIntentId },
        data: { status: 'REFUNDED' },
      });

      logger.info(`Refund created: ${refund.id} for payment ${paymentIntentId}`);
      return refund;
    } catch (error) {
      logger.error('Error creating refund:', error);
      throw error;
    }
  }

  async getPaymentDetails(sessionId: string): Promise<Stripe.Checkout.Session> {
    try {
      return await this.stripe.checkout.sessions.retrieve(sessionId);
    } catch (error) {
      logger.error('Error retrieving payment details:', error);
      throw error;
    }
  }
}

export const stripeService = new StripeService();