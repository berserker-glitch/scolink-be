import nodemailer from 'nodemailer';
import env from '@/config/env';
import { logger } from '@/utils/logger';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const emailService = {
  async sendEmail(options: SendEmailOptions): Promise<void> {
    try {
      await transporter.sendMail({
        from: env.EMAIL_FROM,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      logger.info('Email sent successfully', { to: options.to, subject: options.subject });
    } catch (error) {
      logger.error('Failed to send email', {
        error: error instanceof Error ? error.message : 'Unknown error',
        to: options.to,
        subject: options.subject,
      });
      throw error;
    }
  },

  async sendTeacherWelcomeEmail(email: string, fullName: string, password: string): Promise<void> {
    const loginUrl = process.env.FRONTEND_URL || 'http://localhost:3000/login';
    const subject = 'Welcome to Scolink - Teacher Account Created';

    const html = `
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
            stroke: #FFFFFF;
            stroke-width: 2;
            stroke-linecap: round;
            stroke-linejoin: round;
          }

          .header h1 {
            color: #FFFFFF;
            font-size: 24px;
            font-weight: 700;
            margin: 0 0 8px;
          }

          .header p {
            color: rgba(255, 255, 255, 0.9);
            font-size: 16px;
            margin: 0;
            font-weight: 400;
          }

          .content {
            padding: 40px 30px;
          }

          .welcome-message {
            font-size: 18px;
            font-weight: 600;
            color: #1F2937;
            margin: 0 0 16px;
          }

          .info-box {
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            padding: 24px;
            margin: 24px 0;
          }

          .info-box h3 {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 16px;
            font-weight: 600;
            color: #1F2937;
            margin: 0 0 16px;
          }

          .icon {
            width: 20px;
            height: 20px;
            color: #8B5CF6;
          }

          .credentials {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .credential-row {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .credential-label {
            font-weight: 500;
            color: #4B5563;
            min-width: 120px;
          }

          .credential-value {
            font-family: 'Monaco', 'Menlo', monospace;
            background: #FFFFFF;
            padding: 4px 8px;
            border-radius: 4px;
            border: 1px solid #E5E7EB;
            font-size: 14px;
            color: #1F2937;
            font-weight: 500;
          }

          .action-section {
            text-align: center;
            margin: 32px 0;
          }

          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%);
            color: #FFFFFF !important;
            text-decoration: none !important;
            padding: 14px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 14px 0 rgba(139, 92, 246, 0.3);
            transition: all 0.3s ease;
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
            <p class="welcome-message">Hello ${fullName},</p>

            <p style="color: #4D4D4D; margin-bottom: 24px;">
              An administrator has created a teacher account for you at Scolink. You can now access your personalized teacher dashboard with a simple calendar interface to manage your schedule and teaching activities.
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
                  <span class="credential-value">${email}</span>
                </div>
                <div class="credential-row">
                  <span class="credential-label">Password:</span>
                  <span class="credential-value">${password}</span>
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

    const text = `🌟 Welcome to Scolink!

Hello ${fullName},

An administrator has created a teacher account for you at Scolink. You can now access your personalized teacher dashboard with a simple calendar interface to manage your schedule and teaching activities.

═══════════════════════════════════════════
📧 Email Address: ${email}
🔐 Password: ${password}
═══════════════════════════════════════════

⚠️  IMPORTANT: This is a temporary password. Please log in immediately and change your password in the settings for security.

Log in here: ${loginUrl}

If you did not expect this email or have any questions, please contact your administrator.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sent with ❤️ from the Scolink Team
Modern educational management made simple
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    await this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  },
};

