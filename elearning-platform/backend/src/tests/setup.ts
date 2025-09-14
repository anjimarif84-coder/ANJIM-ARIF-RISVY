import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

// Mock external services
jest.mock('nodemailer', () => ({
  createTransporter: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  })),
}));

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({
          id: 'cs_test_session_id',
          url: 'https://checkout.stripe.com/test',
        }),
        retrieve: jest.fn().mockResolvedValue({
          id: 'cs_test_session_id',
          payment_status: 'paid',
          metadata: { userId: 'test-user-id', courseId: 'test-course-id' },
        }),
      },
    },
    webhooks: {
      constructEvent: jest.fn().mockReturnValue({
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_session_id',
            metadata: { userId: 'test-user-id', courseId: 'test-course-id' },
          },
        },
      }),
    },
    refunds: {
      create: jest.fn().mockResolvedValue({
        id: 're_test_refund_id',
        status: 'succeeded',
      }),
    },
  }));
});

jest.mock('aws-sdk', () => ({
  S3: jest.fn(() => ({
    getSignedUrlPromise: jest.fn().mockResolvedValue('https://test-signed-url.com'),
    deleteObject: jest.fn(() => ({ promise: jest.fn().mockResolvedValue({}) })),
    headObject: jest.fn(() => ({ promise: jest.fn().mockResolvedValue({}) })),
  })),
}));

// Global test database and Redis instances
declare global {
  var __PRISMA__: PrismaClient;
  var __REDIS__: Redis;
}

beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/elearning_test';
  process.env.REDIS_URL = process.env.TEST_REDIS_URL || 'redis://localhost:6379/1';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
});

beforeEach(async () => {
  // Clean up database before each test
  if (global.__PRISMA__) {
    const tablenames = await global.__PRISMA__.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname='public'
    `;

    for (const { tablename } of tablenames) {
      if (tablename !== '_prisma_migrations') {
        await global.__PRISMA__.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
      }
    }
  }

  // Clean up Redis
  if (global.__REDIS__) {
    await global.__REDIS__.flushdb();
  }
});

afterAll(async () => {
  // Cleanup
  if (global.__PRISMA__) {
    await global.__PRISMA__.$disconnect();
  }
  if (global.__REDIS__) {
    await global.__REDIS__.disconnect();
  }
});