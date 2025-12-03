import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private isEmailConfigured: boolean = false;
  private emailFrom: string = 'noreply@example.com';

  constructor(private configService: ConfigService) {
    this.initializeEmailService();
  }

  private initializeEmailService() {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = this.configService.get<number>('SMTP_PORT') || 587;
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPassword = this.configService.get<string>('SMTP_PASSWORD');
    const emailFrom = this.configService.get<string>('EMAIL_FROM') || smtpUser;

    this.logger.log('Initializing SMTP email service...');
    this.logger.log(`SMTP Host: ${smtpHost || 'NOT SET'}`);
    this.logger.log(`SMTP Port: ${smtpPort}`);
    this.logger.log(`SMTP User: ${smtpUser ? '***SET***' : 'NOT SET'}`);
    this.logger.log(`Email From: ${emailFrom}`);

    if (!smtpHost || !smtpUser || !smtpPassword) {
      this.logger.warn('❌ SMTP not configured. Email sending will not work.');
      this.logger.warn('Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD in environment variables.');
      this.isEmailConfigured = false;
      this.transporter = null;
      this.emailFrom = emailFrom || 'noreply@example.com';
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
      });

      this.emailFrom = emailFrom || 'noreply@example.com';
      this.isEmailConfigured = true;
      this.logger.log('✅ SMTP email service initialized successfully');
      this.logger.log(`Emails will be sent from: ${emailFrom}`);

      // Verify connection
      this.transporter.verify((error) => {
        if (error) {
          this.logger.error('❌ SMTP connection failed:', error.message);
        } else {
          this.logger.log('✅ SMTP connection verified successfully');
        }
      });
    } catch (error) {
      this.logger.error('❌ Failed to initialize SMTP:', error);
      this.isEmailConfigured = false;
      this.transporter = null;
      this.emailFrom = emailFrom || 'noreply@example.com';
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<void> {
    if (!this.isEmailConfigured || !this.transporter) {
      const error = new Error('Email service is not configured. Please set SMTP_HOST, SMTP_USER, SMTP_PASSWORD.');
      this.logger.error('Cannot send email:', error.message);
      throw error;
    }

    const { to, subject, html, text } = options;

    try {
      const result = await this.transporter.sendMail({
        from: this.emailFrom,
        to,
        subject,
        html,
        text,
      });

      this.logger.log('✅ Email sent successfully via SMTP:', {
        messageId: result.messageId,
        to,
        from: this.emailFrom,
      });
    } catch (error) {
      const errorDetails = {
        message: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'Error',
      };

      this.logger.error('❌ Email sending failed via SMTP:', errorDetails);
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
          <h2 style="color: #1f2937; margin-top: 0;">Добро пожаловать в MNU Events!</h2>
          <p style="color: #4b5563; font-size: 16px;">Спасибо за регистрацию. Пожалуйста, подтвердите вашу почту, введя код ниже:</p>

          <div style="background: #ffffff; border: 2px solid #d62e1f; border-radius: 8px; padding: 25px; text-align: center; margin: 30px 0;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">Ваш код подтверждения</p>
            <h1 style="color: #d62e1f; font-size: 36px; font-weight: bold; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">
              ${code}
            </h1>
          </div>

          <p style="color: #6b7280; font-size: 14px; margin: 20px 0;">
            <strong>⏰ Код действителен 24 часа.</strong>
          </p>

          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="color: #92400e; font-size: 14px; margin: 0;">
              <strong>⚠️ Безопасность:</strong> Если вы не запрашивали этот код, проигнорируйте это письмо.
            </p>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            С уважением,<br>
            <strong style="color: #d62e1f;">Команда MNU Events</strong><br>
            <span style="color: #9ca3af;">Maqsut Narikbayev University</span>
          </p>
        </div>
      </body>
      </html>
    `;

    const text = `
MNU Events - Подтверждение Email

Добро пожаловать в MNU Events!

Ваш код подтверждения: ${code}

Код действителен 24 часа.

Если вы не запрашивали этот код, проигнорируйте это письмо.

С уважением,
Команда MNU Events
Maqsut Narikbayev University
    `;

    await this.sendEmail({
      to: email,
      subject: 'MNU Events - Код подтверждения',
      html,
      text,
    });
  }

  isConfigured(): boolean {
    return this.isEmailConfigured;
  }
}
