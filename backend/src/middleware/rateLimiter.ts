import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'); // 15 minutes
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');

export const rateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const key = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();

  if (!store[key] || now > store[key].resetTime) {
    store[key] = {
      count: 1,
      resetTime: now + WINDOW_MS
    };
  } else {
    store[key].count++;
  }

  if (store[key].count > MAX_REQUESTS) {
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.ceil((store[key].resetTime - now) / 1000)
    });
    return;
  }

  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', MAX_REQUESTS - store[key].count);
  res.setHeader('X-RateLimit-Reset', store[key].resetTime);

  next();
};
