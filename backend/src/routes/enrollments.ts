import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { createError } from '../middleware/errorHandler';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const enrollSchema = z.object({
  body: z.object({
    courseId: z.string(),
  }),
});

/**
 * @swagger
 * /api/enrollments:
 *   get:
 *     summary: Get user's enrollments
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user enrollments
 */
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: req.user!.id },
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
    });

    res.json(enrollments);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/enrollments:
 *   post:
 *     summary: Enroll in a course
 *     tags: [Enrollments]
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
 *       201:
 *         description: Successfully enrolled in course
 *       409:
 *         description: Already enrolled in course
 */
router.post(
  '/',
  authenticate,
  authorize('STUDENT'),
  validate(enrollSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const { courseId } = req.body;

      // Check if course exists
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
        throw createError('Already enrolled in this course', 409);
      }

      const enrollment = await prisma.enrollment.create({
        data: {
          userId: req.user!.id,
          courseId,
        },
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
            },
          },
        },
      });

      res.status(201).json(enrollment);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/enrollments/{courseId}:
 *   delete:
 *     summary: Unenroll from a course
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully unenrolled from course
 *       404:
 *         description: Enrollment not found
 */
router.delete('/:courseId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { courseId } = req.params;

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: req.user!.id,
          courseId,
        },
      },
    });

    if (!enrollment) {
      throw createError('Enrollment not found', 404);
    }

    await prisma.enrollment.delete({
      where: {
        userId_courseId: {
          userId: req.user!.id,
          courseId,
        },
      },
    });

    res.json({ message: 'Successfully unenrolled from course' });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/enrollments/{courseId}/progress:
 *   get:
 *     summary: Get course progress
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course progress retrieved
 */
router.get('/:courseId/progress', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { courseId } = req.params;

    // Check if user is enrolled
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: req.user!.id,
          courseId,
        },
      },
    });

    if (!enrollment) {
      throw createError('Not enrolled in this course', 403);
    }

    // Get course lessons
    const lessons = await prisma.lesson.findMany({
      where: { courseId },
      select: { id: true, title: true, order: true },
      orderBy: { order: 'asc' },
    });

    // Get user's progress for each lesson
    const progress = await prisma.lessonProgress.findMany({
      where: {
        userId: req.user!.id,
        lessonId: { in: lessons.map(l => l.id) },
      },
    });

    // Calculate overall progress
    const totalLessons = lessons.length;
    const completedLessons = progress.filter(p => p.completed).length;
    const overallProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    res.json({
      courseId,
      totalLessons,
      completedLessons,
      overallProgress,
      lessons: lessons.map(lesson => {
        const lessonProgress = progress.find(p => p.lessonId === lesson.id);
        return {
          ...lesson,
          completed: lessonProgress?.completed || false,
          progress: lessonProgress?.progress || 0,
        };
      }),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/enrollments/{courseId}/lessons/{lessonId}/progress:
 *   put:
 *     summary: Update lesson progress
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               progress:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               completed:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Progress updated successfully
 */
router.put(
  '/:courseId/lessons/:lessonId/progress',
  authenticate,
  async (req: AuthRequest, res, next) => {
    try {
      const { courseId, lessonId } = req.params;
      const { progress, completed } = req.body;

      // Check if user is enrolled
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: req.user!.id,
            courseId,
          },
        },
      });

      if (!enrollment) {
        throw createError('Not enrolled in this course', 403);
      }

      // Check if lesson belongs to course
      const lesson = await prisma.lesson.findFirst({
        where: {
          id: lessonId,
          courseId,
        },
      });

      if (!lesson) {
        throw createError('Lesson not found in this course', 404);
      }

      // Update or create progress
      const lessonProgress = await prisma.lessonProgress.upsert({
        where: {
          userId_lessonId: {
            userId: req.user!.id,
            lessonId,
          },
        },
        update: {
          progress: progress || 0,
          completed: completed || false,
        },
        create: {
          userId: req.user!.id,
          lessonId,
          progress: progress || 0,
          completed: completed || false,
        },
      });

      res.json(lessonProgress);
    } catch (error) {
      next(error);
    }
  }
);

export { router as enrollmentRoutes };