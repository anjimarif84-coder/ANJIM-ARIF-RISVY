import { RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from 'ioredis';
import type { RequestHandler } from 'express';

export function createRateLimiter(): RequestHandler {
  const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT || 6379),
    enableReadyCheck: false,
  });
  const limiter = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'rlflx',
    points: 100,
    duration: 60,
    blockDuration: 60,
  });

  return async (req, res, next) => {
    try {
      const key = req.ip || 'global';
      await limiter.consume(key);
      return next();
    } catch {
      return res.status(429).json({ message: 'Too Many Requests' });
    }
  };
}

