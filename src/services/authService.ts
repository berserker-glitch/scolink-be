import { User, UserRole } from '@prisma/client';
import { prisma } from '@/config/database';
import { hashPassword, verifyPassword } from '@/utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '@/utils/jwt';
import { logger } from '@/utils/logger';
import { createError } from '@/middleware/errorHandler';
import { LoginInput, AuthResponse } from '@/types/auth';

export class AuthService {
  static async login(credentials: LoginInput): Promise<AuthResponse> {
    const { email, password } = credentials;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: { center: true },
    });

    if (!user || !user.isActive) {
      throw createError('Invalid credentials', 401);
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw createError('Invalid credentials', 401);
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      centerId: user.centerId || undefined,
    });

    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token in database
    await prisma.userSession.create({
      data: {
        userId: user.id,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    logger.info('User logged in successfully', { userId: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        centerId: user.centerId || undefined,
      },
      accessToken,
      refreshToken,
    };
  }

  static async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Verify refresh token
      const { userId } = verifyRefreshToken(refreshToken);

      // Check if session exists and is valid
      const session = await prisma.userSession.findFirst({
        where: {
          refreshToken,
          userId,
          expiresAt: { gt: new Date() },
        },
        include: { user: true },
      });

      if (!session || !session.user.isActive) {
        throw createError('Invalid refresh token', 401);
      }

      // Generate new tokens
      const newAccessToken = generateAccessToken({
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role,
        centerId: session.user.centerId || undefined,
      });

      const newRefreshToken = generateRefreshToken(session.user.id);

      // Update session with new refresh token
      await prisma.userSession.update({
        where: { id: session.id },
        data: {
          refreshToken: newRefreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      logger.info('Token refreshed successfully', { userId: session.user.id });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      logger.error('Token refresh failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw createError('Invalid refresh token', 401);
    }
  }

  static async logout(refreshToken: string): Promise<void> {
    try {
      // Remove session from database
      await prisma.userSession.deleteMany({
        where: { refreshToken },
      });

      logger.info('User logged out successfully');
    } catch (error) {
      logger.error('Logout failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      // Don't throw error for logout
    }
  }

  static async logoutAllSessions(userId: string): Promise<void> {
    try {
      // Remove all sessions for user
      await prisma.userSession.deleteMany({
        where: { userId },
      });

      logger.info('All sessions logged out', { userId });
    } catch (error) {
      logger.error('Logout all sessions failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw createError('Failed to logout all sessions', 500);
    }
  }

  static async getUserProfile(userId: string): Promise<{
    id: string;
    email: string;
    fullName: string;
    role: string;
    centerId?: string;
  }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          centerId: true,
          isActive: true,
        },
      });

      if (!user || !user.isActive) {
        throw createError('User not found or inactive', 404);
      }

      return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        centerId: user.centerId || undefined,
      };
    } catch (error) {
      logger.error('Get user profile failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
      if (error instanceof Error && 'statusCode' in error) {
        throw error;
      }
      
      throw createError('Failed to get user profile', 500);
    }
  }
}
