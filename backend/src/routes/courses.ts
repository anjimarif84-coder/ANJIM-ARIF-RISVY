import { Router } from 'express';
import { PrismaClient, CourseStatus } from '@prisma/client';
import { z } from 'zod';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { createError } from '../middleware/errorHandler';
import { generateSignedUrl } from '../services/aws';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createCourseSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    price: z.number().positive(),
    thumbnail: z.string().optional(),
  }),
});

const updateCourseSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    price: z.number().positive().optional(),
    thumbnail: z.string().optional(),
    status: z.nativeEnum(CourseStatus).optional(),
  }),
});

const createLessonSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    content: z.string().optional(),
    videoUrl: z.string().optional(),
    duration: z.number().positive().optional(),
    order: z.number().int().positive(),
    type: z.enum(['VIDEO', 'TEXT', 'QUIZ']),
  }),
});

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: Get all published courses
 *     tags: [Courses]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of courses
 */
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const skip = (page - 1) * limit;

    const where = {
      status: CourseStatus.PUBLISHED,
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: limit,
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
              enrollments: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.course.count({ where }),
    ]);

    res.json({
      courses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/courses/{id}:
 *   get:
 *     summary: Get course by ID
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course details
 *       404:
 *         description: Course not found
 */
router.get('/:id', async (req, res, next) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: req.params.id },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        lessons: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            description: true,
            duration: true,
            order: true,
            type: true,
          },
        },
        _count: {
          select: {
            lessons: true,
            enrollments: true,
          },
        },
      },
    });

    if (!course) {
      throw createError('Course not found', 404);
    }

    res.json(course);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/courses:
 *   post:
 *     summary: Create a new course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - price
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               thumbnail:
 *                 type: string
 *     responses:
 *       201:
 *         description: Course created successfully
 *       403:
 *         description: Insufficient permissions
 */
router.post(
  '/',
  authenticate,
  authorize('TEACHER', 'ADMIN'),
  validate(createCourseSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const { title, description, price, thumbnail } = req.body;

      const course = await prisma.course.create({
        data: {
          title,
          description,
          price,
          thumbnail,
          instructorId: req.user!.id,
        },
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
      });

      res.status(201).json(course);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/courses/{id}:
 *   put:
 *     summary: Update course
 *     tags: [Courses]
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
 *         description: Course updated successfully
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Course not found
 */
router.put(
  '/:id',
  authenticate,
  authorize('TEACHER', 'ADMIN'),
  validate(updateCourseSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const courseId = req.params.id;
      const updateData = req.body;

      // Check if user owns the course or is admin
      const existingCourse = await prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!existingCourse) {
        throw createError('Course not found', 404);
      }

      if (existingCourse.instructorId !== req.user!.id && req.user!.role !== 'ADMIN') {
        throw createError('Insufficient permissions', 403);
      }

      const course = await prisma.course.update({
        where: { id: courseId },
        data: updateData,
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
      });

      res.json(course);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/courses/{id}/lessons:
 *   post:
 *     summary: Add lesson to course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               - title
 *               - order
 *               - type
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               content:
 *                 type: string
 *               videoUrl:
 *                 type: string
 *               duration:
 *                 type: number
 *               order:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [VIDEO, TEXT, QUIZ]
 *     responses:
 *       201:
 *         description: Lesson created successfully
 *       403:
 *         description: Insufficient permissions
 */
router.post(
  '/:id/lessons',
  authenticate,
  authorize('TEACHER', 'ADMIN'),
  validate(createLessonSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const courseId = req.params.id;
      const lessonData = req.body;

      // Check if user owns the course or is admin
      const course = await prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        throw createError('Course not found', 404);
      }

      if (course.instructorId !== req.user!.id && req.user!.role !== 'ADMIN') {
        throw createError('Insufficient permissions', 403);
      }

      const lesson = await prisma.lesson.create({
        data: {
          ...lessonData,
          courseId,
        },
      });

      res.status(201).json(lesson);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/courses/{id}/video-url:
 *   get:
 *     summary: Get signed URL for course video
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: videoKey
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Signed URL generated
 *       403:
 *         description: User not enrolled in course
 */
router.get(
  '/:id/video-url',
  authenticate,
  async (req: AuthRequest, res, next) => {
    try {
      const courseId = req.params.id;
      const videoKey = req.query.videoKey as string;

      if (!videoKey) {
        throw createError('Video key is required', 400);
      }

      // Check if user is enrolled in the course
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: req.user!.id,
            courseId,
          },
        },
      });

      if (!enrollment && req.user!.role !== 'ADMIN') {
        throw createError('You must be enrolled in this course to access videos', 403);
      }

      // Generate signed URL
      const signedUrl = await generateSignedUrl(videoKey);

      res.json({ signedUrl });
    } catch (error) {
      next(error);
    }
  }
);

export { router as courseRoutes };