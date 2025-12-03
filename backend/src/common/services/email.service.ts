import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;
  private isEmailConfigured: boolean = false;
  private emailFrom: string;

  constructor(private configService: ConfigService) {
    this.initializeEmailService();
  }

  private initializeEmailService() {
    const resendApiKey = this.configService.get('RESEND_API_KEY');
    const emailFrom = this.configService.get('email.from') || 'onboarding@resend.dev';

    this.logger.log('Initializing Resend email service...');
    this.logger.log(`Resend API Key: ${resendApiKey ? '***SET***' : 'NOT SET'}`);
    this.logger.log(`Email From: ${emailFrom}`);

    if (!resendApiKey) {
      this.logger.warn('❌ RESEND_API_KEY not configured. Email sending will not work.');
      this.logger.warn('Get your API key from: https://resend.com/api-keys');
      this.isEmailConfigured = false;
      this.resend = null;
      this.emailFrom = emailFrom;
      return;
    }

    try {
      this.resend = new Resend(resendApiKey);
      this.emailFrom = emailFrom;
      this.isEmailConfigured = true;
      this.logger.log('✅ Resend email service initialized successfully');
      this.logger.log(`Emails will be sent from: ${emailFrom}`);
    } catch (error) {
      this.logger.error('❌ Failed to initialize Resend:', error);
      this.isEmailConfigured = false;
      this.resend = null;
      this.emailFrom = emailFrom;
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<void> {
    if (!this.isEmailConfigured || !this.resend) {
      const error = new Error('Email service is not configured. Please set RESEND_API_KEY in environment variables.');
      this.logger.error('Cannot send email:', error.message);
      throw error;
    }

    const { to, subject, html, text } = options;

    try {
      const result = await this.resend.emails.send({
        from: `MNU Events <${this.emailFrom}>`,
        to: [to],
        subject,
        html,
        text,
      });

      this.logger.log('Email sent successfully via Resend:', {
        id: result.data?.id,
        from: this.emailFrom,
      });
    } catch (error) {
      const errorDetails = {
        message: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'Error',
        stack: error instanceof Error ? error.stack : undefined,
      };

      this.logger.error('Email sending failed via Resend:', errorDetails);
      throw error;
    }
  }

  async sendVerificationEmail(email: string, code: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #d62e1f 0%, #b91c1c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">MNU Events</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
          <h2 style="color: #1f2937; margin-top: 0;">Welcome to MNU Events!</h2>
          <p style="color: #4b5563; font-size: 16px;">Thank you for registering. Please verify your email address by entering the code below:</p>

          <div style="background: #ffffff; border: 2px solid #d62e1f; border-radius: 8px; padding: 25px; text-align: center; margin: 30px 0;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
            <h1 style="color: #d62e1f; font-size: 36px; font-weight: bold; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">
              ${code}
            </h1>
          </div>

          <p style="color: #6b7280; font-size: 14px; margin: 20px 0;">
            <strong>⏰ This code will expire in 24 hours.</strong>
          </p>

          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="color: #92400e; font-size: 14px; margin: 0;">
              <strong>⚠️ Security Notice:</strong> If you didn't request this code, please ignore this email or contact support.
            </p>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            Best regards,<br>
            <strong style="color: #d62e1f;">MNU Events Team</strong><br>
            <span style="color: #9ca3af;">Maqsut Narikbayev University</span>
          </p>
        </div>
      </body>
      </html>
    `;

    const text = `
MNU Events - Email Verification

Welcome to MNU Events!

Your verification code is: ${code}

This code will expire in 24 hours.

If you didn't request this code, please ignore this email.

Best regards,
MNU Events Team
Maqsut Narikbayev University
    `;

    await this.sendEmail({
      to: email,
      subject: 'MNU Events - Email Verification Code',
      html,
      text,
    });
  }

  isConfigured(): boolean {
    return this.isEmailConfigured;
  }
}
