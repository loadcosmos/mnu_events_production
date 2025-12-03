import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private apiKey: string | null = null;
  private apiUrl: string = 'https://api.smtp2go.com/v3/email/send';
  private isEmailConfigured: boolean = false;
  private emailFrom: string = 'riverdaleaibar@gmail.com';

  constructor(private configService: ConfigService) {
    this.initializeEmailService();
  }

  private initializeEmailService() {
    this.apiKey = this.configService.get<string>('SMTP2GO_API_KEY');
    this.apiUrl = this.configService.get<string>('SMTP2GO_API_URL') || 'https://api.smtp2go.com/v3/email/send';
    const emailFrom = this.configService.get<string>('EMAIL_FROM');

    if (emailFrom) {
      this.emailFrom = emailFrom;
    }

    this.logger.log('Initializing SMTP2GO email service...');
    this.logger.log(`SMTP2GO API Key: ${this.apiKey ? '***SET***' : 'NOT SET'}`);
    this.logger.log(`Email From: ${this.emailFrom}`);

    if (!this.apiKey) {
      this.logger.warn('❌ SMTP2GO_API_KEY not configured. Email sending will not work.');
      this.isEmailConfigured = false;
      return;
    }

    this.isEmailConfigured = true;
    this.logger.log('✅ SMTP2GO email service initialized successfully');
  }

  async sendEmail(options: SendEmailOptions): Promise<void> {
    if (!this.isEmailConfigured || !this.apiKey) {
      const error = new Error('Email service is not configured. Please set SMTP2GO_API_KEY in environment variables.');
      this.logger.error('Cannot send email:', error.message);
      throw error;
    }

    const { to, subject, html, text } = options;

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: this.apiKey,
          to: [to],
          sender: this.emailFrom,
          subject: subject,
          html_body: html,
          text_body: text,
        }),
      });

      const data = await response.json();

      if (!response.ok || (data.data && data.data.error_code)) {
        throw new Error(`SMTP2GO API Error: ${JSON.stringify(data)}`);
      }

      this.logger.log('✅ Email sent successfully via SMTP2GO:', {
        requestId: data.request_id,
        to,
        from: this.emailFrom,
      });
    } catch (error) {
      const errorDetails = {
        message: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'Error',
      };

      this.logger.error('❌ Email sending failed via SMTP2GO:', errorDetails);
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
