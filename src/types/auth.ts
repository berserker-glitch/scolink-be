import { z } from 'zod';

// Login Schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Register Schema
export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phoneNumber: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// Signup Schema for creating center and admin together
export const signupSchema = z.object({
  center: z.object({
    name: z.string().min(2, 'Center name must be at least 2 characters'),
    location: z.string().min(5, 'Location must be at least 5 characters'),
    phoneNumber: z.string().min(1, 'Phone number is required'),
    email: z.string().email('Invalid email format'),
  }),
  admin: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    phoneNumber: z.string().min(1, 'Phone number is required'),
  }),
});

export type SignupInput = z.infer<typeof signupSchema>;

// Refresh Token Schema
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

// Auth Response
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    centerId?: string;
  };
  accessToken: string;
  refreshToken: string;
}

// Password Reset Schemas
export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// Request with authenticated user
import { Request } from 'express';
import { JwtPayload } from './common';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}