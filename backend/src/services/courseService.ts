import { PrismaClient, Course, Lesson, Quiz, UserRole } from '@prisma/client';
import { CreateCourseRequest, CreateLessonRequest, CreateQuizRequest, PaginationParams } from '../types';
import { createError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export class CourseService {
  static async createCourse(data: CreateCourseRequest, instructorId: string): Promise<Course> {
    const course = await prisma.course.create({
      data: {
        ...data,
        instructorId,
      },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return course;
  }

  static async getCourses(params: PaginationParams = {}): Promise<{ courses: Course[]; total: number }> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = params;
    const skip = (page - 1) * limit;

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        where: {
          status: 'PUBLISHED',
        },
        include: {
          instructor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: {
              lessons: true,
              enrollments: true,
            },
          },
        },
      }),
      prisma.course.count({
        where: {
          status: 'PUBLISHED',
        },
      }),
    ]);

    return { courses, total };
  }

  static async getCourseById(id: string, userId?: string): Promise<Course & { isEnrolled?: boolean }> {
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        lessons: {
          orderBy: { order: 'asc' },
        },
        quizzes: {
          include: {
            _count: {
              select: {
                questions: true,
              },
            },
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

    // Check if user is enrolled (if userId provided)
    let isEnrolled = false;
    if (userId) {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId: id,
          },
        },
      });
      isEnrolled = !!enrollment;
    }

    return { ...course, isEnrolled };
  }

  static async updateCourse(id: string, data: Partial<CreateCourseRequest>, userId: string, userRole: UserRole): Promise<Course> {
    const course = await prisma.course.findUnique({
      where: { id },
    });

    if (!course) {
      throw createError('Course not found', 404);
    }

    // Check permissions
    if (userRole !== 'ADMIN' && course.instructorId !== userId) {
      throw createError('Not authorized to update this course', 403);
    }

    const updatedCourse = await prisma.course.update({
      where: { id },
      data,
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return updatedCourse;
  }

  static async deleteCourse(id: string, userId: string, userRole: UserRole): Promise<void> {
    const course = await prisma.course.findUnique({
      where: { id },
    });

    if (!course) {
      throw createError('Course not found', 404);
    }

    // Check permissions
    if (userRole !== 'ADMIN' && course.instructorId !== userId) {
      throw createError('Not authorized to delete this course', 403);
    }

    await prisma.course.delete({
      where: { id },
    });
  }

  static async createLesson(courseId: string, data: CreateLessonRequest, userId: string, userRole: UserRole): Promise<Lesson> {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw createError('Course not found', 404);
    }

    // Check permissions
    if (userRole !== 'ADMIN' && course.instructorId !== userId) {
      throw createError('Not authorized to add lessons to this course', 403);
    }

    const lesson = await prisma.lesson.create({
      data: {
        ...data,
        courseId,
      },
    });

    return lesson;
  }

  static async updateLesson(lessonId: string, data: Partial<CreateLessonRequest>, userId: string, userRole: UserRole): Promise<Lesson> {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { course: true },
    });

    if (!lesson) {
      throw createError('Lesson not found', 404);
    }

    // Check permissions
    if (userRole !== 'ADMIN' && lesson.course.instructorId !== userId) {
      throw createError('Not authorized to update this lesson', 403);
    }

    const updatedLesson = await prisma.lesson.update({
      where: { id: lessonId },
      data,
    });

    return updatedLesson;
  }

  static async deleteLesson(lessonId: string, userId: string, userRole: UserRole): Promise<void> {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { course: true },
    });

    if (!lesson) {
      throw createError('Lesson not found', 404);
    }

    // Check permissions
    if (userRole !== 'ADMIN' && lesson.course.instructorId !== userId) {
      throw createError('Not authorized to delete this lesson', 403);
    }

    await prisma.lesson.delete({
      where: { id: lessonId },
    });
  }

  static async createQuiz(courseId: string, data: CreateQuizRequest, userId: string, userRole: UserRole): Promise<Quiz> {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw createError('Course not found', 404);
    }

    // Check permissions
    if (userRole !== 'ADMIN' && course.instructorId !== userId) {
      throw createError('Not authorized to add quizzes to this course', 403);
    }

    const quiz = await prisma.quiz.create({
      data: {
        title: data.title,
        description: data.description,
        courseId,
        questions: {
          create: data.questions,
        },
      },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return quiz;
  }

  static async getInstructorCourses(instructorId: string, params: PaginationParams = {}): Promise<{ courses: Course[]; total: number }> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = params;
    const skip = (page - 1) * limit;

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where: { instructorId },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: {
              lessons: true,
              enrollments: true,
            },
          },
        },
      }),
      prisma.course.count({
        where: { instructorId },
      }),
    ]);

    return { courses, total };
  }
}