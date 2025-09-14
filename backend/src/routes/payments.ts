import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { requireAuth } from '../middleware/auth';

export function paymentsRouter(prisma: PrismaClient) {
  const router = Router();
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-06-20' });

  router.post('/checkout/:courseId', requireAuth(['STUDENT', 'TEACHER', 'ADMIN']), async (req: any, res) => {
    const course = await prisma.course.findUnique({ where: { id: req.params.courseId } });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    const amountCents = 5000; // example price
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price_data: { currency: 'usd', unit_amount: amountCents, product_data: { name: course.title } }, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/dashboard?success=1`,
      cancel_url: `${process.env.FRONTEND_URL}/courses/${course.id}?canceled=1`,
      metadata: { courseId: course.id, userId: req.user.id },
    });
    await prisma.payment.create({ data: { courseId: course.id, userId: req.user.id, stripeSession: session.id, amountCents, currency: 'usd' } });
    res.json({ url: session.url });
  });

  router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    if (!sig) return res.status(400).send('Missing signature');
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || '');
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const payment = await prisma.payment.findUnique({ where: { stripeSession: session.id } });
      if (payment) {
        await prisma.payment.update({ where: { id: payment.id }, data: { status: 'PAID' } });
        // Enroll user
        await prisma.enrollment.upsert({
          where: { userId_courseId: { userId: payment.userId, courseId: payment.courseId } },
          create: { userId: payment.userId, courseId: payment.courseId },
          update: {},
        });
      }
    }

    res.json({ received: true });
  });

  return router;
}

