import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { execSync } from 'child_process';

export default async () => {
  console.log('🔧 Setting up test environment...');

  // Initialize Prisma client
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/elearning_test',
      },
    },
  });

  // Initialize Redis client
  const redis = new Redis(process.env.TEST_REDIS_URL || 'redis://localhost:6379/1');

  try {
    // Run database migrations
    execSync('npx prisma migrate deploy', {
      env: {
        ...process.env,
        DATABASE_URL: process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/elearning_test',
      },
      stdio: 'inherit',
    });

    // Generate Prisma client
    execSync('npx prisma generate', { stdio: 'inherit' });

    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected');

    // Test Redis connection
    await redis.ping();
    console.log('✅ Redis connected');

    // Store global instances
    global.__PRISMA__ = prisma;
    global.__REDIS__ = redis;

  } catch (error) {
    console.error('❌ Test setup failed:', error);
    process.exit(1);
  }
};