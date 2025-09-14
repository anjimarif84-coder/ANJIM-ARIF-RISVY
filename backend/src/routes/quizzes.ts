import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { createError } from '../middleware/errorHandler';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const submitQuizSchema = z.object({
  body: z.object({
    answers: z.array(z.object({
      questionId: z.string(),
      answer: z.any(),
    })),
  }),
});

/**
 * @swagger
 * /api/quizzes/{quizId}:
 *   get:
 *     summary: Get quiz by ID
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quiz retrieved successfully
 *       404:
 *         description: Quiz not found
 */
router.get('/:quizId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { quizId } = req.params;

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        lesson: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!quiz) {
      throw createError('Quiz not found', 404);
    }

    // Check if user is enrolled in the course
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: req.user!.id,
          courseId: quiz.lesson.courseId,
        },
      },
    });

    if (!enrollment && req.user!.role !== 'ADMIN') {
      throw createError('You must be enrolled in this course to access quizzes', 403);
    }

    res.json(quiz);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/quizzes/{quizId}/submit:
 *   post:
 *     summary: Submit quiz answers
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - answers
 *             properties:
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     questionId:
 *                       type: string
 *                     answer:
 *                       type: any
 *     responses:
 *       200:
 *         description: Quiz submitted successfully
 *       400:
 *         description: Invalid quiz submission
 */
router.post(
  '/:quizId/submit',
  authenticate,
  validate(submitQuizSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const { quizId } = req.params;
      const { answers } = req.body;

      // Get quiz
      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
          lesson: {
            include: {
              course: true,
            },
          },
        },
      });

      if (!quiz) {
        throw createError('Quiz not found', 404);
      }

      // Check if user is enrolled in the course
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: req.user!.id,
            courseId: quiz.lesson.courseId,
          },
        },
      });

      if (!enrollment && req.user!.role !== 'ADMIN') {
        throw createError('You must be enrolled in this course to submit quizzes', 403);
      }

      // Check if user has already submitted this quiz
      const existingResponse = await prisma.quizResponse.findUnique({
        where: {
          userId_quizId: {
            userId: req.user!.id,
            quizId,
          },
        },
      });

      if (existingResponse) {
        throw createError('Quiz already submitted', 400);
      }

      // Calculate score
      const questions = quiz.questions as any[];
      let correctAnswers = 0;
      const totalQuestions = questions.length;

      for (const question of questions) {
        const userAnswer = answers.find((a: any) => a.questionId === question.id);
        if (userAnswer && userAnswer.answer === question.correctAnswer) {
          correctAnswers++;
        }
      }

      const score = Math.round((correctAnswers / totalQuestions) * 100);

      // Save quiz response
      const quizResponse = await prisma.quizResponse.create({
        data: {
          userId: req.user!.id,
          quizId,
          answers,
          score,
        },
      });

      res.json({
        message: 'Quiz submitted successfully',
        score,
        correctAnswers,
        totalQuestions,
        quizResponse,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/quizzes/{quizId}/results:
 *   get:
 *     summary: Get quiz results
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quiz results retrieved
 *       404:
 *         description: Quiz results not found
 */
router.get('/:quizId/results', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { quizId } = req.params;

    const quizResponse = await prisma.quizResponse.findUnique({
      where: {
        userId_quizId: {
          userId: req.user!.id,
          quizId,
        },
      },
      include: {
        quiz: {
          include: {
            lesson: {
              include: {
                course: true,
              },
            },
          },
        },
      },
    });

    if (!quizResponse) {
      throw createError('Quiz results not found', 404);
    }

    res.json(quizResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/quizzes/user/{userId}:
 *   get:
 *     summary: Get all quiz results for a user
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User quiz results retrieved
 */
router.get('/user/:userId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { userId } = req.params;

    // Check if user is requesting their own results or is admin
    if (req.user!.id !== userId && req.user!.role !== 'ADMIN') {
      throw createError('Insufficient permissions', 403);
    }

    const quizResponses = await prisma.quizResponse.findMany({
      where: { userId },
      include: {
        quiz: {
          include: {
            lesson: {
              include: {
                course: true,
              },
            },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    res.json(quizResponses);
  } catch (error) {
    next(error);
  }
});

export { router as quizRoutes };