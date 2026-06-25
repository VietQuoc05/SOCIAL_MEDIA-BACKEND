import { Injectable } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class MailService {
  constructor() {
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    }
  }

  // ============================
  // ✅ SEND VERIFY EMAIL
  // ============================
  async sendVerifyEmail(to: string, token: string) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const link = `${frontendUrl}/auth/verify?token=${token}`;

    await this.sendMail({
      to,
      subject: 'Verify your account - Social Media',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Social Media!</h2>
          <p>Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${link}" 
               style="background-color: #1877f2; color: white; padding: 12px 32px; 
                      text-decoration: none; border-radius: 6px; font-size: 16px; display: inline-block;">
              Verify Account
            </a>
          </div>
          <p>Or copy and paste this link in your browser:</p>
          <p style="color: #666; word-break: break-all;">${link}</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            If you didn't create an account, please ignore this email.
          </p>
        </div>
      `,
    });
  }

  // ============================
  // ✅ SEND RESET PASSWORD EMAIL
  // ============================
  async sendResetPasswordEmail(to: string, token: string) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const link = `${frontendUrl}/auth/reset-password?token=${token}`;

    await this.sendMail({
      to,
      subject: 'Reset your password - Social Media',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Reset your password</h2>
          <p>You requested to reset your password. Click the button below to set a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${link}" 
               style="background-color: #1877f2; color: white; padding: 12px 32px; 
                      text-decoration: none; border-radius: 6px; font-size: 16px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>Or copy and paste this link in your browser:</p>
          <p style="color: #666; word-break: break-all;">${link}</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            This link will expire in 15 minutes. If you didn't request this, please ignore this email.
          </p>
        </div>
      `,
    });
  }

  // ============================
  // ✅ GENERIC SEND MAIL
  // ============================
  private async sendMail(options: {
    to: string;
    subject: string;
    html: string;
  }) {
    const fromEmail = process.env.MAIL_FROM || 'noreply@social-media.com';

    // Nếu chưa config SendGrid, log ra console (dev mode)
    if (!process.env.SENDGRID_API_KEY) {
      console.log('==================================');
      console.log('📧 EMAIL (dev mode - no SendGrid configured)');
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`HTML: ${options.html}`);
      console.log('==================================');
      return;
    }

    await sgMail.send({
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
  }
}