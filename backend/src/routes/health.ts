import { Router } from 'express';
import { HealthCheckService, MonitoringService } from '../services/monitoring';

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *       503:
 *         description: Service is unhealthy
 */
router.get('/', async (req, res) => {
  try {
    const health = await HealthCheckService.getOverallHealth();
    
    if (health.status === 'healthy') {
      res.status(200).json(health);
    } else {
      res.status(503).json(health);
    }
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
});

/**
 * @swagger
 * /api/health/metrics:
 *   get:
 *     summary: Get application metrics
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Application metrics
 */
router.get('/metrics', (req, res) => {
  const monitoring = MonitoringService.getInstance();
  
  const metrics = {
    timestamp: new Date().toISOString(),
    totalRequests: monitoring.getMetrics().length,
    averageResponseTime: monitoring.getAverageResponseTime(),
    errorRate: monitoring.getErrorRate(),
    topEndpoints: monitoring.getTopEndpoints(10),
  };
  
  res.json(metrics);
});

/**
 * @swagger
 * /api/health/metrics/{endpoint}:
 *   get:
 *     summary: Get metrics for specific endpoint
 *     tags: [Health]
 *     parameters:
 *       - in: path
 *         name: endpoint
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Endpoint metrics
 */
router.get('/metrics/:endpoint', (req, res) => {
  const monitoring = MonitoringService.getInstance();
  const { endpoint } = req.params;
  
  const metrics = {
    timestamp: new Date().toISOString(),
    endpoint,
    totalRequests: monitoring.getMetricsByEndpoint(endpoint).length,
    averageResponseTime: monitoring.getAverageResponseTime(endpoint),
    errorRate: monitoring.getErrorRate(endpoint),
  };
  
  res.json(metrics);
});

export { router as healthRoutes };