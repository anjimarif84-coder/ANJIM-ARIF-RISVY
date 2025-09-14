import { PrismaClient, Enrollment, Progress } from '@prisma/client';
import { createError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export class EnrollmentService {
  static async enrollInCourse(userId: string, courseId: string): Promise<Enrollment> {
    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw createError('Course not found', 404);
    }

    if (course.status !== 'PUBLISHED') {
      throw createError('Course is not available for enrollment', 400);
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (existingEnrollment) {
      throw createError('Already enrolled in this course', 409);
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
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
                email: true,
              },
            },
          },
        },
      },
    });

    return enrollment;
  }

  static async getUserEnrollments(userId: string): Promise<Enrollment[]> {
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
                email: true,
              },
            },
            _count: {
              select: {
                lessons: true,
              },
            },
          },
        },
        _count: {
          select: {
            progress: true,
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    return enrollments;
  }

  static async getCourseEnrollments(courseId: string, instructorId: string): Promise<Enrollment[]> {
    // Verify instructor owns the course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course || course.instructorId !== instructorId) {
      throw createError('Course not found or not authorized', 404);
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            progress: true,
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    return enrollments;
  }

  static async updateProgress(userId: string, lessonId: string, enrollmentId: string): Promise<Progress> {
    // Verify enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
    });

    if (!enrollment || enrollment.userId !== userId) {
      throw createError('Enrollment not found', 404);
    }

    // Check if lesson belongs to the course
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson || lesson.courseId !== enrollment.courseId) {
      throw createError('Lesson not found in this course', 404);
    }

    // Update or create progress
    const progress = await prisma.progress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      update: {
        completed: true,
        completedAt: new Date(),
      },
      create: {
        userId,
        lessonId,
        enrollmentId,
        completed: true,
        completedAt: new Date(),
      },
    });

    return progress;
  }

  static async getProgress(userId: string, courseId: string): Promise<Progress[]> {
    // Verify enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (!enrollment) {
      throw createError('Not enrolled in this course', 404);
    }

    const progress = await prisma.progress.findMany({
      where: {
        userId,
        enrollmentId: enrollment.id,
      },
      include: {
        lesson: true,
      },
      orderBy: {
        lesson: {
          order: 'asc',
        },
      },
    });

    return progress;
  }

  static async cancelEnrollment(userId: string, courseId: string): Promise<void> {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (!enrollment) {
      throw createError('Enrollment not found', 404);
    }

    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { status: 'CANCELLED' },
    });
  }

  static async completeCourse(userId: string, courseId: string): Promise<void> {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (!enrollment) {
      throw createError('Enrollment not found', 404);
    }

    // Check if all lessons are completed
    const totalLessons = await prisma.lesson.count({
      where: { courseId },
    });

    const completedLessons = await prisma.progress.count({
      where: {
        userId,
        enrollmentId: enrollment.id,
        completed: true,
      },
    });

    if (completedLessons < totalLessons) {
      throw createError('Cannot complete course. Not all lessons are finished.', 400);
    }

    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { 
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });
  }
}