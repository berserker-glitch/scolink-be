import rateLimit from 'express-rate-limit';
import env from '@/config/env';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
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
  max: env.NODE_ENV === 'production' ? env.AUTH_RATE_LIMIT_MAX_REQUESTS : Math.max(env.AUTH_RATE_LIMIT_MAX_REQUESTS, 100),
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
  max: env.NODE_ENV === 'production' ? env.PASSWORD_RESET_RATE_LIMIT_MAX_REQUESTS : Math.max(env.PASSWORD_RESET_RATE_LIMIT_MAX_REQUESTS, 20),
  message: {
    success: false,
    message: 'Too many password reset attempts',
    errors: ['Too many password reset attempts. Please try again later.'],
  },
  standardHeaders: true,
  legacyHeaders: false,
});
