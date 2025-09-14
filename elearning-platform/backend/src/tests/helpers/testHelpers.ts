import { PrismaClient, User, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request } from 'express';

export const createTestUser = async (
  prisma: PrismaClient,
  userData: Partial<User> = {}
): Promise<User> => {
  const defaultUser = {
    email: `test-${Date.now()}@example.com`,
    password: await bcrypt.hash('password123', 10),
    firstName: 'Test',
    lastName: 'User',
    role: 'STUDENT' as UserRole,
    isEmailVerified: true,
  };

  return prisma.user.create({
    data: { ...defaultUser, ...userData },
  });
};

export const createAuthenticatedRequest = (user: User): Partial<Request> => {
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET!
  );

  return {
    headers: {
      authorization: `Bearer ${token}`,
    },
    user: user as any,
  };
};

export const createTestCourse = async (
  prisma: PrismaClient,
  teacherId: string,
  courseData: any = {}
) => {
  const defaultCourse = {
    title: `Test Course ${Date.now()}`,
    description: 'A test course for unit testing',
    shortDescription: 'Test course',
    price: 99.99,
    teacherId,
  };

  return prisma.course.create({
    data: { ...defaultCourse, ...courseData },
  });
};

export const createTestLesson = async (
  prisma: PrismaClient,
  courseId: string,
  lessonData: any = {}
) => {
  const defaultLesson = {
    title: `Test Lesson ${Date.now()}`,
    description: 'A test lesson',
    order: 1,
    courseId,
    isPublished: true,
  };

  return prisma.lesson.create({
    data: { ...defaultLesson, ...lessonData },
  });
};

export const createTestQuiz = async (
  prisma: PrismaClient,
  courseId: string,
  quizData: any = {}
) => {
  const defaultQuiz = {
    title: `Test Quiz ${Date.now()}`,
    description: 'A test quiz',
    courseId,
    passingScore: 70,
    isPublished: true,
  };

  const quiz = await prisma.quiz.create({
    data: { ...defaultQuiz, ...quizData },
  });

  // Add a test question
  await prisma.quizQuestion.create({
    data: {
      question: 'What is 2 + 2?',
      type: 'MULTIPLE_CHOICE',
      options: ['3', '4', '5', '6'],
      correctAnswer: '4',
      points: 1,
      order: 1,
      quizId: quiz.id,
    },
  });

  return quiz;
};

export const createTestEnrollment = async (
  prisma: PrismaClient,
  userId: string,
  courseId: string
) => {
  return prisma.enrollment.create({
    data: {
      userId,
      courseId,
      status: 'ACTIVE',
    },
  });
};

export const cleanupTestData = async (prisma: PrismaClient) => {
  // Delete in reverse order of dependencies
  await prisma.quizResponse.deleteMany();
  await prisma.quizQuestion.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.progress.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.course.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();
};

export const expectErrorResponse = (response: any, statusCode: number, message?: string) => {
  expect(response.status).toBe(statusCode);
  expect(response.body.success).toBe(false);
  if (message) {
    expect(response.body.error).toContain(message);
  }
};

export const expectSuccessResponse = (response: any, statusCode: number = 200) => {
  expect(response.status).toBe(statusCode);
  expect(response.body.success).toBe(true);
  expect(response.body.data).toBeDefined();
};

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));