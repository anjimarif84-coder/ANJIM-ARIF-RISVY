import * as Sentry from '@sentry/node';
import { logger } from './logger';

// Performance monitoring
export class PerformanceMonitor {
  private static timers: Map<string, number> = new Map();

  static start(operation: string): void {
    this.timers.set(operation, Date.now());
  }

  static end(operation: string): number {
    const startTime = this.timers.get(operation);
    if (!startTime) {
      logger.warn(`No start time found for operation: ${operation}`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.timers.delete(operation);

    logger.info(`Operation completed: ${operation}`, {
      operation,
      duration: `${duration}ms`,
    });

    // Log slow operations
    if (duration > 1000) {
      logger.warn(`Slow operation detected: ${operation}`, {
        operation,
        duration: `${duration}ms`,
      });
    }

    return duration;
  }

  static async measure<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    this.start(operation);
    try {
      const result = await fn();
      this.end(operation);
      return result;
    } catch (error) {
      this.end(operation);
      throw error;
    }
  }
}

// Health check utilities
export class HealthCheck {
  private static checks: Map<string, () => Promise<boolean>> = new Map();

  static register(name: string, check: () => Promise<boolean>): void {
    this.checks.set(name, check);
  }

  static async runAll(): Promise<{ [key: string]: boolean }> {
    const results: { [key: string]: boolean } = {};

    for (const [name, check] of this.checks.entries()) {
      try {
        results[name] = await check();
      } catch (error) {
        logger.error(`Health check failed: ${name}`, error);
        results[name] = false;
      }
    }

    return results;
  }

  static async isHealthy(): Promise<boolean> {
    const results = await this.runAll();
    return Object.values(results).every(result => result === true);
  }
}

// Metrics collection
export class MetricsCollector {
  private static metrics: Map<string, number> = new Map();
  private static counters: Map<string, number> = new Map();

  static gauge(name: string, value: number): void {
    this.metrics.set(name, value);
    logger.debug(`Metric updated: ${name} = ${value}`);
  }

  static increment(name: string, value: number = 1): void {
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current + value);
    logger.debug(`Counter incremented: ${name} = ${current + value}`);
  }

  static getMetrics(): { [key: string]: number } {
    const allMetrics: { [key: string]: number } = {};
    
    for (const [name, value] of this.metrics.entries()) {
      allMetrics[name] = value;
    }
    
    for (const [name, value] of this.counters.entries()) {
      allMetrics[name] = value;
    }
    
    return allMetrics;
  }

  static reset(): void {
    this.metrics.clear();
    this.counters.clear();
  }
}

// Error tracking and reporting
export class ErrorTracker {
  static reportError(error: Error, context?: any): void {
    logger.error('Application error', {
      message: error.message,
      stack: error.stack,
      context,
    });

    // Report to Sentry in production
    if (process.env.NODE_ENV === 'production') {
      Sentry.captureException(error, {
        extra: context,
      });
    }

    // Increment error counter
    MetricsCollector.increment('errors.total');
    MetricsCollector.increment(`errors.${error.constructor.name}`);
  }

  static reportUserError(userId: string, error: Error, context?: any): void {
    logger.error('User-specific error', {
      userId,
      message: error.message,
      stack: error.stack,
      context,
    });

    if (process.env.NODE_ENV === 'production') {
      Sentry.withScope(scope => {
        scope.setUser({ id: userId });
        scope.setExtra('context', context);
        Sentry.captureException(error);
      });
    }

    MetricsCollector.increment('errors.user');
  }

  static reportSecurityEvent(event: string, details: any): void {
    logger.warn('Security event detected', {
      event,
      details,
      timestamp: new Date().toISOString(),
    });

    if (process.env.NODE_ENV === 'production') {
      Sentry.captureMessage(`Security event: ${event}`, {
        level: 'warning',
        extra: details,
      });
    }

    MetricsCollector.increment('security.events');
    MetricsCollector.increment(`security.${event}`);
  }
}

// System monitoring
export class SystemMonitor {
  private static interval: NodeJS.Timeout | null = null;

  static start(): void {
    if (this.interval) {
      return;
    }

    this.interval = setInterval(() => {
      this.collectSystemMetrics();
    }, 60000); // Collect every minute

    logger.info('System monitoring started');
  }

  static stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      logger.info('System monitoring stopped');
    }
  }

  private static collectSystemMetrics(): void {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    // Memory metrics
    MetricsCollector.gauge('memory.rss', memUsage.rss);
    MetricsCollector.gauge('memory.heapTotal', memUsage.heapTotal);
    MetricsCollector.gauge('memory.heapUsed', memUsage.heapUsed);
    MetricsCollector.gauge('memory.external', memUsage.external);

    // CPU metrics
    MetricsCollector.gauge('cpu.user', cpuUsage.user);
    MetricsCollector.gauge('cpu.system', cpuUsage.system);

    // Process metrics
    MetricsCollector.gauge('process.uptime', process.uptime());
    MetricsCollector.gauge('process.pid', process.pid);

    logger.debug('System metrics collected', {
      memory: memUsage,
      cpu: cpuUsage,
      uptime: process.uptime(),
    });
  }
}

// Alert manager
export class AlertManager {
  private static thresholds: Map<string, number> = new Map();
  private static alertsSent: Set<string> = new Set();

  static setThreshold(metric: string, threshold: number): void {
    this.thresholds.set(metric, threshold);
  }

  static checkThresholds(): void {
    const metrics = MetricsCollector.getMetrics();

    for (const [metric, threshold] of this.thresholds.entries()) {
      const value = metrics[metric];
      if (value !== undefined && value > threshold) {
        const alertKey = `${metric}-${threshold}`;
        
        if (!this.alertsSent.has(alertKey)) {
          this.sendAlert(metric, value, threshold);
          this.alertsSent.add(alertKey);
        }
      }
    }

    // Clear sent alerts periodically
    setTimeout(() => {
      this.alertsSent.clear();
    }, 300000); // 5 minutes
  }

  private static sendAlert(metric: string, value: number, threshold: number): void {
    const message = `Alert: ${metric} (${value}) exceeded threshold (${threshold})`;
    
    logger.error(message, {
      metric,
      value,
      threshold,
      timestamp: new Date().toISOString(),
    });

    if (process.env.NODE_ENV === 'production') {
      Sentry.captureMessage(message, {
        level: 'error',
        extra: { metric, value, threshold },
      });
    }

    // Here you could integrate with external alerting systems
    // like Slack, PagerDuty, etc.
  }
}

// Initialize monitoring
export const initializeMonitoring = (): void => {
  // Set up health checks
  HealthCheck.register('database', async () => {
    try {
      // This would be implemented with actual database check
      return true;
    } catch {
      return false;
    }
  });

  HealthCheck.register('redis', async () => {
    try {
      // This would be implemented with actual Redis check
      return true;
    } catch {
      return false;
    }
  });

  // Set up alert thresholds
  AlertManager.setThreshold('memory.heapUsed', 500 * 1024 * 1024); // 500MB
  AlertManager.setThreshold('errors.total', 100);
  AlertManager.setThreshold('security.events', 10);

  // Start system monitoring
  SystemMonitor.start();

  logger.info('Monitoring initialized');
};