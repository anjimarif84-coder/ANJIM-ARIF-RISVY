import { Request, Response, NextFunction } from 'express';
import { MonitoringService } from '../services/monitoring';

export const monitoringMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    const monitoring = MonitoringService.getInstance();
    monitoring.recordMetric({
      timestamp: new Date(),
      endpoint: req.route?.path || req.path,
      method: req.method,
      statusCode: res.statusCode,
      responseTime: duration,
      userId: (req as any).user?.id,
      ip: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent'),
    });
  });
  
  next();
};