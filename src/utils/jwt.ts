import jwt from 'jsonwebtoken';
import env from '@/config/env';
import { JwtPayload } from '@/types/common';

export const generateAccessToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);
};

export const verifyAccessToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

export const verifyRefreshToken = (token: string): { userId: string } => {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as { userId: string };
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

export const getTokenExpiration = (token: string): Date => {
  const decoded = jwt.decode(token) as JwtPayload;
  return new Date(decoded.exp * 1000);
};
