import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  
  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  // Server
  PORT: z.string().transform(Number).default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  TRUST_PROXY: z.coerce.boolean().default(false),
  
  // CORS
  CORS_ORIGIN: z.string()
    .default('http://localhost:8080,http://localhost:5173,https://app.scolink.ink,https://scolink.ink,https://www.scolink.ink')
    .transform((value) => value.split(',').map(origin => origin.trim()).filter(Boolean)),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  AUTH_RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('10'),
  PASSWORD_RESET_RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('5'),
  
  // Super Admin
  SUPER_ADMIN_EMAIL: z.string().email().default('admin@admin.com'),
  SUPER_ADMIN_PASSWORD: z.string().min(8).default('replace-with-super-admin-password'),

  // Email Service
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().email('EMAIL_FROM must be a valid email address').optional(),
  SMTP_SECURE: z.coerce.boolean().default(false),

  // Paddle
  PADDLE_WEBHOOK_SECRET: z.string().optional(),
  PADDLE_CLIENT_TOKEN: z.string().optional(),
  PADDLE_PRODUCT_ID: z.string().optional(),
  PADDLE_PRICE_PRO: z.string().optional(),
  PADDLE_PRICE_PREMIUM: z.string().optional(),
  PADDLE_PRICE_LIFETIME: z.string().optional(),
}).superRefine((env, ctx) => {
  if (env.NODE_ENV === 'production' && env.SUPER_ADMIN_PASSWORD.includes('replace-with')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['SUPER_ADMIN_PASSWORD'],
      message: 'SUPER_ADMIN_PASSWORD must be set to a real secret in production',
    });
  }
});

const env = envSchema.parse(process.env);

export default env;
