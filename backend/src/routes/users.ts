import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { createError } from '../middleware/errorHandler';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    avatar: z.string().optional(),
  }),
});

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               avatar:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put(
  '/profile',
  authenticate,
  validate(updateProfileSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const updateData = req.body;

      const user = await prisma.user.update({
        where: { id: req.user!.id },
        data: updateData,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      res.json(user);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/users/dashboard:
 *   get:
 *     summary: Get user dashboard data
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved
 */
router.get('/dashboard', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;

    // Get user's enrollments with course details
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            instructor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            _count: {
              select: {
                lessons: true,
              },
            },
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
      take: 5, // Recent enrollments
    });

    // Get user's quiz results
    const quizResults = await prisma.quizResponse.findMany({
      where: { userId },
      include: {
        quiz: {
          include: {
            lesson: {
              include: {
                course: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
      take: 5, // Recent quiz results
    });

    // Get user's progress summary
    const progressSummary = await prisma.lessonProgress.groupBy({
      by: ['userId'],
      where: { userId },
      _count: {
        id: true,
      },
      _sum: {
        progress: true,
      },
    });

    // Get total lessons across all enrolled courses
    const totalLessons = await prisma.lesson.count({
      where: {
        course: {
          enrollments: {
            some: {
              userId,
            },
          },
        },
      },
    });

    const completedLessons = await prisma.lessonProgress.count({
      where: {
        userId,
        completed: true,
      },
    });

    const overallProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    res.json({
      enrollments,
      quizResults,
      progress: {
        totalLessons,
        completedLessons,
        overallProgress,
      },
      stats: {
        totalEnrollments: enrollments.length,
        averageQuizScore: quizResults.length > 0 
          ? Math.round(quizResults.reduce((sum, result) => sum + result.score, 0) / quizResults.length)
          : 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/users/notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notifications retrieved
 */
router.get('/notifications', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json(notifications);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/users/notifications/{id}/read:
 *   put:
 *     summary: Mark notification as read
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.put('/notifications/:id/read', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.updateMany({
      where: {
        id,
        userId: req.user!.id,
      },
      data: {
        read: true,
      },
    });

    if (notification.count === 0) {
      throw createError('Notification not found', 404);
    }

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
});

export { router as userRoutes };