import { Request, Response, NextFunction } from 'express';
import * as Sentry from '@sentry/node';
import { createError } from './errorHandler';

// Performance monitoring
export const performanceMonitoring = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Log performance metrics
    console.log(`[PERFORMANCE] ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
    
    // Send to monitoring service (e.g., DataDog, New Relic)
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to DataDog
      // datadog.increment('http.requests', 1, [`method:${req.method}`, `status:${res.statusCode}`]);
      // datadog.timing('http.request.duration', duration, [`method:${req.method}`, `endpoint:${req.url}`]);
    }
    
    // Alert on slow requests
    if (duration > 10000) { // 10 seconds
      console.warn(`[SLOW_REQUEST] ${req.method} ${req.url} took ${duration}ms`);
      Sentry.addBreadcrumb({
        message: 'Slow request detected',
        level: 'warning',
        data: {
          method: req.method,
          url: req.url,
          duration,
        },
      });
    }
  });
  
  next();
};

// Health check endpoint
export const healthCheck = (req: Request, res: Response) => {
  const healthData = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV,
    services: {
      database: 'OK', // You can add actual health checks here
      redis: 'OK',
      s3: 'OK',
    },
  };
  
  res.status(200).json(healthData);
};

// Detailed health check
export const detailedHealthCheck = async (req: Request, res: Response) => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check Redis connection (if using Redis)
    // const redis = require('redis');
    // const client = redis.createClient(process.env.REDIS_URL);
    // await client.ping();
    
    const healthData = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV,
      services: {
        database: 'OK',
        redis: 'OK',
        s3: 'OK',
      },
    };
    
    res.status(200).json(healthData);
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: 'Service unavailable',
    });
  }
};

// Error tracking middleware
export const errorTracking = (error: any, req: Request, res: Response, next: NextFunction) => {
  // Log error details
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id,
  });
  
  // Send to Sentry
  Sentry.withScope((scope) => {
    scope.setTag('url', req.url);
    scope.setTag('method', req.method);
    scope.setUser({
      id: (req as any).user?.id,
      email: (req as any).user?.email,
    });
    scope.setContext('request', {
      url: req.url,
      method: req.method,
      headers: req.headers,
      body: req.body,
    });
    
    Sentry.captureException(error);
  });
  
  next(error);
};

// Request logging
export const requestLogging = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: (req as any).user?.id,
    };
    
    // Use structured logging
    console.log(JSON.stringify(logData));
  });
  
  next();
};

// Metrics collection
export const metricsCollection = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Collect metrics
    const metrics = {
      endpoint: `${req.method} ${req.route?.path || req.url}`,
      statusCode: res.statusCode,
      duration,
      timestamp: new Date().toISOString(),
    };
    
    // Send to metrics service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to Prometheus, DataDog, etc.
      console.log(`[METRICS] ${JSON.stringify(metrics)}`);
    }
  });
  
  next();
};

// Memory usage monitoring
export const memoryMonitoring = () => {
  setInterval(() => {
    const memUsage = process.memoryUsage();
    const memUsageMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
    };
    
    console.log(`[MEMORY] ${JSON.stringify(memUsageMB)}`);
    
    // Alert on high memory usage
    if (memUsageMB.heapUsed > 500) { // 500MB
      console.warn(`[HIGH_MEMORY] Heap usage: ${memUsageMB.heapUsed}MB`);
      Sentry.addBreadcrumb({
        message: 'High memory usage detected',
        level: 'warning',
        data: memUsageMB,
      });
    }
  }, 60000); // Check every minute
};

// Database query monitoring
export const databaseMonitoring = (prisma: any) => {
  prisma.$use(async (params: any, next: any) => {
    const startTime = Date.now();
    
    try {
      const result = await next(params);
      const duration = Date.now() - startTime;
      
      // Log slow queries
      if (duration > 1000) { // 1 second
        console.warn(`[SLOW_QUERY] ${params.model}.${params.action} took ${duration}ms`);
        Sentry.addBreadcrumb({
          message: 'Slow database query detected',
          level: 'warning',
          data: {
            model: params.model,
            action: params.action,
            duration,
          },
        });
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[DB_ERROR] ${params.model}.${params.action} failed after ${duration}ms:`, error);
      
      Sentry.captureException(error, {
        tags: {
          component: 'database',
          model: params.model,
          action: params.action,
        },
      });
      
      throw error;
    }
  });
};