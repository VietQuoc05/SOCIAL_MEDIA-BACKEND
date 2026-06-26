import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY || '';
  }

  // ============================
  // ✅ SEND VERIFY EMAIL
  // ============================
  async sendVerifyEmail(to: string, token: string) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const link = `${frontendUrl}/auth/verify?token=${token}`;

    await this.sendMailViaApi({
      to,
      subject: 'Verify your account - Social Media',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Social Media!</h2>
          <p>Please verify your email address by clicking the button below:</p>
          <table border="0" cellpadding="0" cellspacing="0" style="margin: 30px auto;">
            <tr>
              <td align="center" bgcolor="#1877f2" style="border-radius: 6px;">
                <a href="${link}" target="_blank" 
                   style="display: block; padding: 12px 32px; color: #ffffff; 
                          text-decoration: none; font-size: 16px; border-radius: 6px;">
                  Verify Account
                </a>
              </td>
            </tr>
          </table>
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
    const link = `${frontendUrl}/reset-password?token=${token}`;

    await this.sendMailViaApi({
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
  // ✅ SEND VIA SENDGRID WEB API (HTTPS)
  // ============================
  private async sendMailViaApi(options: {
    to: string;
    subject: string;
    html: string;
  }) {
    const fromEmail = process.env.MAIL_FROM || 'noreply@social-media.com';

    // Dev mode: không có API Key
    if (!this.apiKey) {
      console.log('==================================');
      console.log('📧 EMAIL (dev mode - no SendGrid API Key)');
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`HTML: ${options.html}`);
      console.log('==================================');
      return;
    }

    console.log(`📧 Sending email to ${options.to} via SendGrid API...`);
    console.log(`   From: ${fromEmail}`);
    console.log(`   Subject: ${options.subject}`);

    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: options.to }],
              subject: options.subject,
            },
          ],
          from: { email: fromEmail },
          content: [
            {
              type: 'text/html',
              value: options.html,
            },
          ],
        }),
      });

      if (response.ok) {
        console.log(`✅ Email sent successfully to ${options.to}`);
      } else {
        const errorBody = await response.text();
        console.error(`❌ SendGrid API error (${response.status}): ${errorBody}`);
        throw new Error(`SendGrid API error: ${response.status} - ${errorBody}`);
      }
    } catch (error) {
      console.error(`❌ Failed to send email to ${options.to}:`, error.message);
      throw error;
    }
  }
}