import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { logger } from '@/utils/logger';

// Rate limiting configurations
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts, please try again later.',
    });
  },
});

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn(`General rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later.',
    });
  },
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 upload requests per hour
  message: {
    error: 'Too many upload requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  next();
};

// Request size limiting
export const requestSizeLimit = (req: Request, res: Response, next: NextFunction) => {
  const contentLength = req.get('content-length');
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (contentLength && parseInt(contentLength) > maxSize) {
    logger.warn(`Request size exceeded limit: ${contentLength} bytes from IP: ${req.ip}`);
    return res.status(413).json({
      success: false,
      error: 'Request entity too large',
    });
  }
  
  next();
};

// IP whitelist/blacklist (example implementation)
export const ipFilter = (req: Request, res: Response, next: NextFunction) => {
  const clientIP = req.ip;
  
  // Example blacklist (in production, this would come from database or config)
  const blacklistedIPs: string[] = [
    // Add IPs to blacklist
  ];
  
  if (blacklistedIPs.includes(clientIP)) {
    logger.warn(`Blocked request from blacklisted IP: ${clientIP}`);
    return res.status(403).json({
      success: false,
      error: 'Access denied',
    });
  }
  
  next();
};

// User agent filtering
export const userAgentFilter = (req: Request, res: Response, next: NextFunction) => {
  const userAgent = req.get('User-Agent') || '';
  
  // Block suspicious user agents
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    // Add more patterns as needed
  ];
  
  // Allow legitimate bots (be careful with this)
  const allowedBots = [
    /googlebot/i,
    /bingbot/i,
    // Add legitimate bots
  ];
  
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
  const isAllowed = allowedBots.some(pattern => pattern.test(userAgent));
  
  if (isSuspicious && !isAllowed) {
    logger.warn(`Blocked suspicious user agent: ${userAgent} from IP: ${req.ip}`);
    return res.status(403).json({
      success: false,
      error: 'Access denied',
    });
  }
  
  next();
};

// Failed login tracking
interface LoginAttempt {
  ip: string;
  email?: string;
  timestamp: Date;
  success: boolean;
}

class LoginAttemptTracker {
  private attempts: LoginAttempt[] = [];
  private readonly maxAttempts = 5;
  private readonly windowMs = 15 * 60 * 1000; // 15 minutes

  addAttempt(ip: string, email: string | undefined, success: boolean) {
    this.attempts.push({
      ip,
      email,
      timestamp: new Date(),
      success,
    });

    // Clean old attempts
    this.cleanOldAttempts();

    if (!success) {
      logger.warn(`Failed login attempt`, {
        ip,
        email,
        timestamp: new Date(),
      });
    }
  }

  isBlocked(ip: string, email?: string): boolean {
    this.cleanOldAttempts();

    const recentFailedAttempts = this.attempts.filter(attempt => {
      const isRecent = Date.now() - attempt.timestamp.getTime() < this.windowMs;
      const matchesIP = attempt.ip === ip;
      const matchesEmail = email ? attempt.email === email : true;
      return isRecent && matchesIP && matchesEmail && !attempt.success;
    });

    return recentFailedAttempts.length >= this.maxAttempts;
  }

  private cleanOldAttempts() {
    const cutoff = Date.now() - this.windowMs;
    this.attempts = this.attempts.filter(
      attempt => attempt.timestamp.getTime() > cutoff
    );
  }
}

export const loginAttemptTracker = new LoginAttemptTracker();

// Middleware to check login attempts
export const checkLoginAttempts = (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body;
  const ip = req.ip;

  if (loginAttemptTracker.isBlocked(ip, email)) {
    logger.warn(`Login blocked due to too many failed attempts`, {
      ip,
      email,
    });
    
    return res.status(429).json({
      success: false,
      error: 'Too many failed login attempts. Please try again later.',
    });
  }

  next();
};

// Content Security Policy
export const cspHeader = (req: Request, res: Response, next: NextFunction) => {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://js.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://api.stripe.com",
    "frame-src 'self' https://js.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  res.setHeader('Content-Security-Policy', csp);
  next();
};