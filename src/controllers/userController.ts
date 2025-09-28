import { Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import { UserService } from '@/services/userService';
import { validate } from '@/middleware/validation';
import { createUserSchema, updateUserSchema, updateProfileSchema, createCenterAdminSchema, createStaffSchema } from '@/types/user';
import { logger } from '@/utils/logger';
import { createError } from '@/middleware/errorHandler';
import { AuthenticatedRequest } from '@/types/common';
import { emailService } from '@/utils/email';

export class UserController {
  static getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          errors: ['User not authenticated'],
        });
        return;
      }
      
      const user = await UserService.getUserById(userId);
      
      res.status(200).json({
        success: true,
        data: user,
        message: 'Profile retrieved successfully',
      });
    } catch (error) {
      logger.error('Get profile failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
      if (error instanceof Error && 'statusCode' in error) {
        res.status((error as any).statusCode).json({
          success: false,
          message: error.message,
          errors: [error.message],
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        errors: ['Get profile failed'],
      });
    }
  };

  static updateProfile = [
    validate(updateProfileSchema),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const userId = (req as any).user?.userId;
        
        if (!userId) {
          res.status(401).json({
            success: false,
            message: 'Authentication required',
            errors: ['User not authenticated'],
          });
          return;
        }
        
        const user = await UserService.updateUser(userId, req.body);
        
        res.status(200).json({
          success: true,
          data: user,
          message: 'Profile updated successfully',
        });
      } catch (error) {
        logger.error('Update profile failed', { error: error instanceof Error ? error.message : 'Unknown error' });
        
        if (error instanceof Error && 'statusCode' in error) {
          res.status((error as any).statusCode).json({
            success: false,
            message: error.message,
            errors: [error.message],
          });
          return;
        }
        
        res.status(500).json({
          success: false,
          message: 'Internal server error',
          errors: ['Update profile failed'],
        });
      }
    },
  ];

  static getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page, limit, search, sortBy, sortOrder } = req.query;
      
      const pagination = {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
        search: search as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      };
      
      const result = await UserService.getUsers(pagination);
      
      res.status(200).json({
        success: true,
        data: result.users,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
        message: 'Users retrieved successfully',
      });
    } catch (error) {
      logger.error('Get users failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        errors: ['Get users failed'],
      });
    }
  };

  static getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const user = await UserService.getUserById(id);
      
      res.status(200).json({
        success: true,
        data: user,
        message: 'User retrieved successfully',
      });
    } catch (error) {
      logger.error('Get user by ID failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
      if (error instanceof Error && 'statusCode' in error) {
        res.status((error as any).statusCode).json({
          success: false,
          message: error.message,
          errors: [error.message],
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        errors: ['Get user failed'],
      });
    }
  };

  static createUser = [
    validate(createUserSchema),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const user = await UserService.createUser(req.body);
        
        res.status(201).json({
          success: true,
          data: user,
          message: 'User created successfully',
        });
      } catch (error) {
        logger.error('Create user failed', { error: error instanceof Error ? error.message : 'Unknown error' });
        
        if (error instanceof Error && 'statusCode' in error) {
          res.status((error as any).statusCode).json({
            success: false,
            message: error.message,
            errors: [error.message],
          });
          return;
        }
        
        res.status(500).json({
          success: false,
          message: 'Internal server error',
          errors: ['Create user failed'],
        });
      }
    },
  ];

  static updateUser = [
    validate(updateUserSchema),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { id } = req.params;
        const user = await UserService.updateUser(id, req.body);
        
        res.status(200).json({
          success: true,
          data: user,
          message: 'User updated successfully',
        });
      } catch (error) {
        logger.error('Update user failed', { error: error instanceof Error ? error.message : 'Unknown error' });
        
        if (error instanceof Error && 'statusCode' in error) {
          res.status((error as any).statusCode).json({
            success: false,
            message: error.message,
            errors: [error.message],
          });
          return;
        }
        
        res.status(500).json({
          success: false,
          message: 'Internal server error',
          errors: ['Update user failed'],
        });
      }
    },
  ];

  static deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await UserService.deleteUser(id);
      
      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      logger.error('Delete user failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
      if (error instanceof Error && 'statusCode' in error) {
        res.status((error as any).statusCode).json({
          success: false,
          message: error.message,
          errors: [error.message],
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        errors: ['Delete user failed'],
      });
    }
  };

  static suspendUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await UserService.suspendUser(id);

      res.status(200).json({
        success: true,
        data: result,
        message: 'User suspended successfully',
      });
    } catch (error) {
      logger.error('Suspend user failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
      if (error instanceof Error && 'statusCode' in error) {
        res.status((error as any).statusCode).json({
          success: false,
          message: error.message,
          errors: [error.message],
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        errors: ['Suspend user failed'],
      });
    }
  };

  static unsuspendUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await UserService.unsuspendUser(id);

      res.status(200).json({
        success: true,
        data: result,
        message: 'User unsuspended successfully',
      });
    } catch (error) {
      logger.error('Unsuspend user failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
      if (error instanceof Error && 'statusCode' in error) {
        res.status((error as any).statusCode).json({
          success: false,
          message: error.message,
          errors: [error.message],
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        errors: ['Unsuspend user failed'],
      });
    }
  };

  static createCenterAdmin = [
    validate(createCenterAdminSchema),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { centerId } = req.params;
        const adminData = {
          ...req.body,
          role: 'center_admin' as const,
          centerId,
        };
        
        const admin = await UserService.createUser(adminData);
        
        res.status(201).json({
          success: true,
          data: admin,
          message: 'Center admin created successfully',
        });
      } catch (error) {
        logger.error('Create center admin failed', { error: error instanceof Error ? error.message : 'Unknown error' });
        
        if (error instanceof Error && 'statusCode' in error) {
          res.status((error as any).statusCode).json({
            success: false,
            message: error.message,
            errors: [error.message],
          });
          return;
        }
        
        res.status(500).json({
          success: false,
          message: 'Internal server error',
          errors: ['Create center admin failed'],
        });
      }
    },
  ];

  static getCenterAdmins = async (req: Request, res: Response): Promise<void> => {
    try {
      const { centerId } = req.params;
      const { page, limit, search, sortBy, sortOrder } = req.query;
      
      const pagination = {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
        search: search as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      };
      
      const result = await UserService.getCenterAdmins(centerId, pagination);
      
      res.status(200).json({
        success: true,
        data: result.admins,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
        message: 'Center admins retrieved successfully',
      });
    } catch (error) {
      logger.error('Get center admins failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        errors: ['Get center admins failed'],
      });
    }
  };

  static changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      const { oldPassword, newPassword } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          errors: ['User not authenticated'],
        });
        return;
      }

      if (!oldPassword || !newPassword) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields',
          errors: ['Old password and new password are required'],
        });
        return;
      }

      await UserService.changePassword(userId, oldPassword, newPassword);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      logger.error('Change password failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
      if (error instanceof Error && 'statusCode' in error) {
        res.status((error as any).statusCode).json({
          success: false,
          message: error.message,
          errors: [error.message],
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        errors: ['Change password failed'],
      });
    }
  };

  static createStaff = [
    validate(createStaffSchema),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const user = (req as any).user as {
          userId: string;
          role: UserRole;
          centerId?: string | null;
        };

        if (!user) {
          res.status(401).json({
            success: false,
            message: 'Authentication required',
            errors: ['User not authenticated'],
          });
          return;
        }

        if (!['super_admin', 'center_admin'].includes(user.role)) {
          res.status(403).json({
            success: false,
            message: 'Insufficient permissions',
            errors: ['Only admins can create staff members'],
          });
          return;
        }

        const { email, fullName } = req.body;

        const result = await UserService.createStaff({
          email,
          fullName,
          createdBy: {
            userId: user.userId,
            role: user.role,
            centerId: user.centerId,
          },
        });

        const loginUrl = `${process.env.APP_URL || 'https://app.scolink.com/login'}`;

        const emailContent = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Scolink</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

              body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: #FAFAFE;
                margin: 0;
                padding: 0;
                line-height: 1.6;
                color: #1A1A1A;
              }

              .container {
                max-width: 600px;
                margin: 0 auto;
                background: #FFFFFF;
                border-radius: 12px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                overflow: hidden;
              }

              .header {
                background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%);
                padding: 40px 30px;
                text-align: center;
                position: relative;
              }

              .logo {
                margin: 0 auto 20px;
                width: 64px;
                height: 64px;
                background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%);
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
              }

              .logo svg {
                width: 32px;
                height: 32px;
                fill: none;
                stroke: white;
                stroke-width: 2;
                stroke-linecap: round;
                stroke-linejoin: round;
              }

              .header h1 {
                color: #FFFFFF;
                font-size: 28px;
                font-weight: 700;
                margin: 0;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              }

              .header p {
                color: rgba(255, 255, 255, 0.9);
                font-size: 16px;
                margin: 8px 0 0;
                font-weight: 400;
              }

              .content {
                padding: 40px 30px;
              }

              .welcome-message {
                font-size: 18px;
                font-weight: 500;
                color: #1A1A1A;
                margin-bottom: 24px;
              }

              .info-box {
                background: #FCFCFE;
                border: 1px solid #E5E7EB;
                border-radius: 12px;
                padding: 24px;
                margin: 24px 0;
              }

              .info-box h3 {
                color: #8B5CF6;
                font-size: 18px;
                font-weight: 600;
                margin: 0 0 16px;
                display: flex;
                align-items: center;
                gap: 8px;
              }

              .info-box .icon {
                width: 20px;
                height: 20px;
                color: #8B5CF6;
              }

              .credentials {
                background: #FFFFFF;
                border: 1px solid #E5E7EB;
                border-radius: 8px;
                padding: 20px;
                margin: 16px 0;
              }

              .credential-row {
                display: flex;
                align-items: center;
                margin-bottom: 12px;
              }

              .credential-row:last-child {
                margin-bottom: 0;
              }

              .credential-label {
                font-weight: 600;
                color: #4D4D4D;
                min-width: 120px;
                font-size: 14px;
              }

              .credential-value {
                font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
                background: #F9FAFB;
                padding: 6px 12px;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                color: #1A1A1A;
                border: 1px solid #E5E7EB;
              }

              .action-section {
                text-align: center;
                margin: 32px 0;
              }

              .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%) !important;
                color: #FFFFFF !important;
                text-decoration: none !important;
                padding: 16px 32px;
                border-radius: 12px;
                font-weight: 600;
                font-size: 16px;
                box-shadow: 0 4px 14px 0 rgba(139, 92, 246, 0.3);
                transition: all 0.2s ease;
                border: none !important;
                cursor: pointer;
                text-align: center;
              }

              .cta-button:link,
              .cta-button:visited,
              .cta-button:hover,
              .cta-button:active,
              .cta-button:focus {
                color: #FFFFFF !important;
                text-decoration: none !important;
              }

              .cta-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px 0 rgba(139, 92, 246, 0.4);
              }

              .warning-box {
                background: #FEF3C7;
                border: 1px solid #F59E0B;
                border-radius: 8px;
                padding: 16px;
                margin: 24px 0;
                display: flex;
                align-items: flex-start;
                gap: 12px;
              }

              .warning-icon {
                color: #F59E0B;
                width: 20px;
                height: 20px;
                flex-shrink: 0;
                margin-top: 2px;
              }

              .warning-text {
                font-size: 14px;
                color: #92400E;
                margin: 0;
                font-weight: 500;
              }

              .footer {
                background: #FCFCFE;
                padding: 30px;
                border-top: 1px solid #E5E7EB;
                text-align: center;
              }

              .footer-text {
                color: #6B7280;
                font-size: 14px;
                margin: 0 0 8px;
              }

              .footer-brand {
                color: #8B5CF6;
                font-weight: 600;
                font-size: 16px;
              }

              .support-text {
                color: #9CA3AF;
                font-size: 12px;
                margin: 8px 0 0;
              }

              @media (max-width: 600px) {
                .container {
                  margin: 10px;
                  border-radius: 8px;
                }

                .header, .content, .footer {
                  padding-left: 20px;
                  padding-right: 20px;
                }

                .credential-row {
                  flex-direction: column;
                  align-items: flex-start;
                  gap: 4px;
                }

                .credential-label {
                  min-width: auto;
                }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <!-- Header -->
              <div class="header">
                <div class="logo">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/>
                    <path d="M22 10v6"/>
                    <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>
                  </svg>
                </div>
                <h1>Welcome to Scolink</h1>
                <p>Your educational management platform</p>
              </div>

              <!-- Content -->
              <div class="content">
                <p class="welcome-message">Hello ${result.user.fullName},</p>

                <p style="color: #4D4D4D; margin-bottom: 24px;">
                  An administrator has created a staff account for you at Scolink. You can now access the platform with the credentials below.
                </p>

                <div class="info-box">
                  <h3>
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    Your Account Details
                  </h3>

                  <div class="credentials">
                    <div class="credential-row">
                      <span class="credential-label">Email Address:</span>
                      <span class="credential-value">${result.user.email}</span>
                    </div>
                    <div class="credential-row">
                      <span class="credential-label">Password:</span>
                      <span class="credential-value">${result.user.password}</span>
                    </div>
                  </div>
                </div>

                <div class="warning-box">
                  <svg class="warning-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <p class="warning-text">
                    <strong>Important:</strong> This is a temporary password. Please log in immediately and change your password in the settings for security.
                  </p>
                </div>

                <div class="action-section">
                  <a href="${loginUrl}" class="cta-button">
                    Log in to Scolink
                  </a>
                </div>

                <p style="color: #6B7280; font-size: 14px; text-align: center; margin: 24px 0 0;">
                  If you did not expect this email or have any questions, please contact your administrator.
                </p>
              </div>

              <!-- Footer -->
              <div class="footer">
                <p class="footer-text">Sent with ❤️ from</p>
                <p class="footer-brand">Scolink Team</p>
                <p class="support-text">Modern educational management made simple</p>
              </div>
            </div>
          </body>
          </html>
        `;

        await emailService.sendEmail({
          to: result.user.email,
          subject: 'Welcome to Scolink - Staff Account Created',
          html: emailContent,
          text: `🌟 Welcome to Scolink!

Hello ${result.user.fullName},

An administrator has created a staff account for you at Scolink. You can now access the platform with the credentials below.

═══════════════════════════════════════════
📧 Email Address: ${result.user.email}
🔐 Password: ${result.user.password}
═══════════════════════════════════════════

⚠️  IMPORTANT: This is a temporary password. Please log in immediately and change your password in the settings for security.

Log in here: ${loginUrl}

If you did not expect this email or have any questions, please contact your administrator.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sent with ❤️ from the Scolink Team
Modern educational management made simple
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        });

        res.status(201).json({
          success: true,
          data: {
            id: result.user.id,
            email: result.user.email,
            fullName: result.user.fullName,
            role: result.user.role,
            createdAt: result.user.createdAt,
          },
          message: 'Staff member created and notified via email',
        });
      } catch (error) {
        logger.error('Create staff failed', { error: error instanceof Error ? error.message : 'Unknown error' });

        if (error instanceof Error && 'statusCode' in error) {
          res.status((error as any).statusCode).json({
            success: false,
            message: error.message,
            errors: [error.message],
          });
          return;
        }

        res.status(500).json({
          success: false,
          message: 'Internal server error',
          errors: ['Create staff failed'],
        });
      }
    },
  ];
}
