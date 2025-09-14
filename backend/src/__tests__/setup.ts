import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db',
    },
  },
});

beforeAll(async () => {
  // Clean up database before tests
  await prisma.$executeRaw`TRUNCATE TABLE "users", "courses", "lessons", "enrollments", "quiz_responses", "lesson_progress", "payments", "notifications", "refresh_tokens", "quizzes" RESTART IDENTITY CASCADE;`;
});

afterAll(async () => {
  await prisma.$disconnect();
});

afterEach(async () => {
  // Clean up after each test
  await prisma.$executeRaw`TRUNCATE TABLE "users", "courses", "lessons", "enrollments", "quiz_responses", "lesson_progress", "payments", "notifications", "refresh_tokens", "quizzes" RESTART IDENTITY CASCADE;`;
});