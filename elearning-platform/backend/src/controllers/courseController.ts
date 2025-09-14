import { Response } from 'express';
import { prisma } from '../index';
import { AppError, asyncHandler } from '@/middleware/errorHandler';
import { AuthenticatedRequest, CreateCourseData, PaginatedResponse } from '@/types';

export const getCourses = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const {
    page = 1,
    limit = 10,
    search,
    category,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where: any = {
    isPublished: true,
  };

  if (search) {
    where.OR = [
      { title: { contains: search as string, mode: 'insensitive' } },
      { description: { contains: search as string, mode: 'insensitive' } },
      { shortDescription: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  if (category) {
    where.categoryId = category as string;
  }

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy as string]: sortOrder as 'asc' | 'desc' },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
            lessons: true,
          },
        },
      },
    }),
    prisma.course.count({ where }),
  ]);

  const response: PaginatedResponse<any> = {
    success: true,
    data: courses,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  };

  res.json(response);
});

export const getCourse = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      teacher: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileImageUrl: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      lessons: {
        where: { isPublished: true },
        orderBy: { order: 'asc' },
        select: {
          id: true,
          title: true,
          description: true,
          duration: true,
          order: true,
          ...(req.user && {
            progress: {
              where: { userId: req.user.id },
              select: {
                isCompleted: true,
                watchedTime: true,
              },
            },
          }),
        },
      },
      quizzes: {
        where: { isPublished: true },
        select: {
          id: true,
          title: true,
          description: true,
          passingScore: true,
          timeLimit: true,
          ...(req.user && {
            responses: {
              where: { userId: req.user.id },
              select: {
                id: true,
                score: true,
                isCompleted: true,
                completedAt: true,
              },
            },
          }),
        },
      },
      _count: {
        select: {
          enrollments: true,
        },
      },
    },
  });

  if (!course) {
    throw new AppError('Course not found', 404);
  }

  // Check if user is enrolled (if authenticated)
  let isEnrolled = false;
  if (req.user) {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: req.user.id,
          courseId: id,
        },
      },
    });
    isEnrolled = !!enrollment;
  }

  res.json({
    success: true,
    data: {
      ...course,
      isEnrolled,
    },
  });
});

export const createCourse = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const courseData: CreateCourseData = req.body;

  const course = await prisma.course.create({
    data: {
      ...courseData,
      teacherId: req.user.id,
    },
    include: {
      teacher: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileImageUrl: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  res.status(201).json({
    success: true,
    data: course,
    message: 'Course created successfully',
  });
});

export const updateCourse = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { id } = req.params;

  // Check if course exists and user owns it
  const existingCourse = await prisma.course.findUnique({
    where: { id },
  });

  if (!existingCourse) {
    throw new AppError('Course not found', 404);
  }

  if (existingCourse.teacherId !== req.user.id && req.user.role !== 'ADMIN') {
    throw new AppError('Not authorized to update this course', 403);
  }

  const course = await prisma.course.update({
    where: { id },
    data: req.body,
    include: {
      teacher: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileImageUrl: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  res.json({
    success: true,
    data: course,
    message: 'Course updated successfully',
  });
});

export const deleteCourse = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { id } = req.params;

  // Check if course exists and user owns it
  const course = await prisma.course.findUnique({
    where: { id },
  });

  if (!course) {
    throw new AppError('Course not found', 404);
  }

  if (course.teacherId !== req.user.id && req.user.role !== 'ADMIN') {
    throw new AppError('Not authorized to delete this course', 403);
  }

  await prisma.course.delete({ where: { id } });

  res.json({
    success: true,
    message: 'Course deleted successfully',
  });
});

export const getMyCourses = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const {
    page = 1,
    limit = 10,
    search,
    status,
  } = req.query;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where: any = {
    teacherId: req.user.id,
  };

  if (search) {
    where.OR = [
      { title: { contains: search as string, mode: 'insensitive' } },
      { description: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  if (status === 'published') {
    where.isPublished = true;
  } else if (status === 'draft') {
    where.isPublished = false;
  }

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
            lessons: true,
            quizzes: true,
          },
        },
      },
    }),
    prisma.course.count({ where }),
  ]);

  const response: PaginatedResponse<any> = {
    success: true,
    data: courses,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  };

  res.json(response);
});

export const publishCourse = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { id } = req.params;

  // Check if course exists and user owns it
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      lessons: true,
    },
  });

  if (!course) {
    throw new AppError('Course not found', 404);
  }

  if (course.teacherId !== req.user.id && req.user.role !== 'ADMIN') {
    throw new AppError('Not authorized to publish this course', 403);
  }

  // Validate course has at least one lesson
  if (course.lessons.length === 0) {
    throw new AppError('Course must have at least one lesson to be published', 400);
  }

  const updatedCourse = await prisma.course.update({
    where: { id },
    data: { isPublished: true },
  });

  res.json({
    success: true,
    data: updatedCourse,
    message: 'Course published successfully',
  });
});