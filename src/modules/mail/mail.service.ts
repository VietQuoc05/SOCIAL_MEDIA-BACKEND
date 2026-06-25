import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // SendGrid SMTP (ưu tiên) hoặc Gmail SMTP (fallback)
    if (process.env.SENDGRID_API_KEY) {
      // Dùng SendGrid qua SMTP
      this.transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY,
        },
      });
    } else if (process.env.MAIL_HOST && process.env.MAIL_USER) {
      // Fallback: Gmail SMTP
      this.transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: parseInt(process.env.MAIL_PORT || '587', 10),
        secure: process.env.MAIL_SECURE === 'true',
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASSWORD,
        },
      });
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

    // Nếu chưa config email, log ra console (dev mode)
    if (!this.transporter) {
      console.log('==================================');
      console.log('📧 EMAIL (dev mode - no SMTP configured)');
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`HTML: ${options.html}`);
      console.log('==================================');
      return;
    }

    console.log(`📧 Sending email to ${options.to} via SendGrid...`);
    console.log(`   From: ${fromEmail}`);
    console.log(`   Subject: ${options.subject}`);

    try {
      const info = await this.transporter.sendMail({
        from: fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      console.log(`✅ Email sent successfully to ${options.to}: ${info.messageId}`);
    } catch (error) {
      console.error(`❌ Failed to send email to ${options.to}:`, error.message);
      if (error.response) {
        console.error(`   SendGrid response: ${error.response}`);
      }
      throw error;
    }
  }
}