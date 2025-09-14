import * as Sentry from '@sentry/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface Metrics {
  timestamp: Date;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  userId?: string;
  ip: string;
  userAgent?: string;
}

export class MonitoringService {
  private static instance: MonitoringService;
  private metrics: Metrics[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 metrics in memory

  private constructor() {}

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  public recordMetric(metric: Metrics): void {
    this.metrics.push(metric);
    
    // Keep only the last maxMetrics entries
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Send to Sentry for error tracking
    if (metric.statusCode >= 400) {
      Sentry.addBreadcrumb({
        message: `HTTP ${metric.method} ${metric.endpoint}`,
        category: 'http',
        level: 'error',
        data: {
          statusCode: metric.statusCode,
          responseTime: metric.responseTime,
          userId: metric.userId,
        },
      });
    }
  }

  public getMetrics(): Metrics[] {
    return [...this.metrics];
  }

  public getMetricsByEndpoint(endpoint: string): Metrics[] {
    return this.metrics.filter(metric => metric.endpoint === endpoint);
  }

  public getAverageResponseTime(endpoint?: string): number {
    const relevantMetrics = endpoint 
      ? this.getMetricsByEndpoint(endpoint)
      : this.metrics;
    
    if (relevantMetrics.length === 0) return 0;
    
    const totalTime = relevantMetrics.reduce((sum, metric) => sum + metric.responseTime, 0);
    return totalTime / relevantMetrics.length;
  }

  public getErrorRate(endpoint?: string): number {
    const relevantMetrics = endpoint 
      ? this.getMetricsByEndpoint(endpoint)
      : this.metrics;
    
    if (relevantMetrics.length === 0) return 0;
    
    const errorCount = relevantMetrics.filter(metric => metric.statusCode >= 400).length;
    return (errorCount / relevantMetrics.length) * 100;
  }

  public getTopEndpoints(limit: number = 10): Array<{ endpoint: string; count: number }> {
    const endpointCounts: { [key: string]: number } = {};
    
    this.metrics.forEach(metric => {
      endpointCounts[metric.endpoint] = (endpointCounts[metric.endpoint] || 0) + 1;
    });
    
    return Object.entries(endpointCounts)
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  public async recordSystemMetrics(): Promise<void> {
    try {
      // Database connection health
      await prisma.$queryRaw`SELECT 1`;
      
      // Record system metrics
      const systemMetrics = {
        timestamp: new Date(),
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
        cpuUsage: process.cpuUsage(),
      };

      // You can send these to CloudWatch, DataDog, or other monitoring services
      console.log('System metrics:', systemMetrics);
      
    } catch (error) {
      console.error('Failed to record system metrics:', error);
      Sentry.captureException(error);
    }
  }

  public async recordBusinessMetrics(): Promise<void> {
    try {
      const [
        totalUsers,
        totalCourses,
        totalEnrollments,
        activeUsers,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.course.count(),
        prisma.enrollment.count(),
        prisma.user.count({
          where: {
            updatedAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
        }),
      ]);

      const businessMetrics = {
        timestamp: new Date(),
        totalUsers,
        totalCourses,
        totalEnrollments,
        activeUsers,
        enrollmentRate: totalUsers > 0 ? (totalEnrollments / totalUsers) * 100 : 0,
      };

      console.log('Business metrics:', businessMetrics);
      
    } catch (error) {
      console.error('Failed to record business metrics:', error);
      Sentry.captureException(error);
    }
  }

  public startPeriodicMetricsCollection(): void {
    // Record system metrics every 5 minutes
    setInterval(() => {
      this.recordSystemMetrics();
    }, 5 * 60 * 1000);

    // Record business metrics every hour
    setInterval(() => {
      this.recordBusinessMetrics();
    }, 60 * 60 * 1000);
  }
}

// Health check service
export class HealthCheckService {
  public static async checkDatabase(): Promise<{ status: string; responseTime: number }> {
    const start = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      return {
        status: 'healthy',
        responseTime: Date.now() - start,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - start,
      };
    }
  }

  public static async checkRedis(): Promise<{ status: string; responseTime: number }> {
    const start = Date.now();
    try {
      const { getRedisClient } = await import('../config/redis');
      const redis = getRedisClient();
      await redis.ping();
      return {
        status: 'healthy',
        responseTime: Date.now() - start,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - start,
      };
    }
  }

  public static async checkS3(): Promise<{ status: string; responseTime: number }> {
    const start = Date.now();
    try {
      const { generateSignedUrl } = await import('../services/aws');
      await generateSignedUrl('health-check-test');
      return {
        status: 'healthy',
        responseTime: Date.now() - start,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - start,
      };
    }
  }

  public static async getOverallHealth(): Promise<{
    status: string;
    timestamp: string;
    services: {
      database: { status: string; responseTime: number };
      redis: { status: string; responseTime: number };
      s3: { status: string; responseTime: number };
    };
  }> {
    const [database, redis, s3] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkS3(),
    ]);

    const allHealthy = [database, redis, s3].every(service => service.status === 'healthy');

    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database,
        redis,
        s3,
      },
    };
  }
}