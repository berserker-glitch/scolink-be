import rateLimit from 'express-rate-limit';
import env from '@/config/env';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: 10000, // Much higher limit for development
  message: {
    success: false,
    message: 'Too many requests',
    errors: ['Rate limit exceeded. Please try again later.'],
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Much higher limit for development
  message: {
    success: false,
    message: 'Too many authentication attempts',
    errors: ['Too many login attempts. Please try again later.'],
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Password reset rate limiter
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // Higher limit for development
  message: {
    success: false,
    message: 'Too many password reset attempts',
    errors: ['Too many password reset attempts. Please try again later.'],
  },
  standardHeaders: true,
  legacyHeaders: false,
});
