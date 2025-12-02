import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { JwtBlacklistService } from './jwt-blacklist.service';
import * as bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto'; // SECURITY FIX: Import full crypto module for timingSafeEqual
import { Response, Request } from 'express';
import { RegisterDto, VerifyEmailDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private transporter: nodemailer.Transporter | null = null;
  private isEmailConfigured: boolean = false;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private jwtBlacklistService: JwtBlacklistService,
  ) {
    // Setup email transporter with validation (async, but don't block constructor)
    this.initializeEmailTransporter().catch((error) => {
      this.logger.error('Failed to initialize email transporter:', error);
    });
  }

  private async initializeEmailTransporter() {
    const smtpHost = this.configService.get('email.smtp.host');
    const smtpPort = this.configService.get('email.smtp.port');
    const smtpUser = this.configService.get('email.smtp.user');
    const smtpPassword = this.configService.get('email.smtp.password');
    const emailFrom = this.configService.get('email.from');

    this.logger.log('Initializing email transporter...');
    this.logger.log(`SMTP Host: ${smtpHost || 'NOT SET'}`);
    this.logger.log(`SMTP Port: ${smtpPort || 'NOT SET'}`);
    this.logger.log(`SMTP User: ${smtpUser ? `${smtpUser.substring(0, 3)}***` : 'NOT SET'}`);
    this.logger.log(`SMTP Password: ${smtpPassword ? '***SET***' : 'NOT SET'}`);
    this.logger.log(`Email From: ${emailFrom || 'NOT SET'}`);

    // Check if SMTP is configured
    if (!smtpHost || !smtpUser || !smtpPassword) {
      this.logger.warn('❌ SMTP not configured. Email verification will not work.');
      this.logger.warn('Required: SMTP_HOST, SMTP_USER, SMTP_PASSWORD');
      this.isEmailConfigured = false;
      this.transporter = null;
      return;
    }

    try {
      // Create transporter
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort || 587,
        secure: smtpPort === 465, // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
        // Additional options for better compatibility
        tls: {
          // Only disable certificate validation in development
          // WARNING: Never use rejectUnauthorized: false in production!
          rejectUnauthorized: process.env.NODE_ENV !== 'development',
        },
      });

      this.logger.log('Transporter created, verifying connection...');

      // Verify connection (async, but we'll wait for it)
      try {
        await new Promise<void>((resolve, reject) => {
          this.transporter!.verify((error, success) => {
            if (error) {
              this.logger.error('❌ SMTP connection verification failed:', error);
              this.logger.error(`Error code: ${(error as any).code}`);
              this.logger.error(`Error message: ${error.message}`);
              this.logger.error('Email verification will not work until SMTP is properly configured.');
              this.isEmailConfigured = false;
              reject(error);
            } else {
              this.logger.log('✅ SMTP connection verified successfully');
              this.logger.log(`Email will be sent from: ${emailFrom || smtpUser}`);
              this.isEmailConfigured = true;
              resolve();
            }
          });
        });
      } catch (verifyError) {
        // Verification failed, but transporter is still created
        // We'll try to send anyway and catch errors during sending
        this.logger.warn('⚠️ SMTP verification failed, but transporter created. Will attempt to send emails.');
        this.isEmailConfigured = false; // Set to false, but keep transporter for retry
      }
    } catch (error) {
      this.logger.error('❌ Failed to create email transporter:', error);
      this.isEmailConfigured = false;
      this.transporter = null;
    }
  }

  async register(registerDto: RegisterDto) {
    const { email, password, firstName, lastName } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password with 12 rounds (increased from 10 for better security)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate cryptographically secure verification code (6 digits)
    const verificationCode = this.generateSecureVerificationCode();
    const verificationCodeExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const now = new Date();

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        verificationCode,
        verificationCodeExpiry,
        lastCodeSentAt: now,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        emailVerified: true,
      },
    });

    // Send verification email
    let emailSent = false;
    let emailError: string | null = null;

    // SECURITY FIX: Don't log email addresses (PII) - use user ID instead
    this.logger.log(`Attempting to send verification email for user: ${user.id}`);
    this.logger.log(`Email configured: ${this.isEmailConfigured}`);
    this.logger.log(`Transporter exists: ${!!this.transporter}`);

    if (!this.isEmailConfigured || !this.transporter) {
      emailError = 'Email service is not configured. Please check SMTP settings.';
      this.logger.error(`❌ Cannot send email: ${emailError}`);
    } else {
      try {
        await this.sendVerificationEmail(email, verificationCode);
        emailSent = true;
        this.logger.log(`✅ Verification email sent successfully for user: ${user.id}`);
      } catch (error) {
        emailError = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`❌ Failed to send verification email for user: ${user.id}`, error);

        // Log detailed error information
        if (error instanceof Error) {
          this.logger.error('Error details:', {
            message: error.message,
            stack: error.stack,
            code: (error as any).code,
            responseCode: (error as any).responseCode,
            command: (error as any).command,
            response: (error as any).response,
          });
        }
      }
    }

    // Return response with email status
    return {
      message: emailSent
        ? 'Registration successful. Please check your email for verification code.'
        : 'Registration successful, but verification email could not be sent. Please use "Resend Code" to receive the verification code.',
      user,
      emailSent,
      ...(emailError && !emailSent ? { emailError } : {}),
    };
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto, res: Response) {
    const { email, code } = verifyEmailDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    if (!user.verificationCode || !user.verificationCodeExpiry) {
      throw new BadRequestException('No verification code found. Please request a new one.');
    }

    if (new Date() > user.verificationCodeExpiry) {
      throw new BadRequestException('Verification code expired. Please request a new one.');
    }

    // SECURITY FIX: Use constant-time comparison to prevent timing attacks
    // This prevents attackers from determining correct digits via timing analysis
    const isCodeValid = this.constantTimeCompare(user.verificationCode, code);
    
    if (!isCodeValid) {
      throw new BadRequestException('Invalid verification code');
    }

    // Mark email as verified
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationCode: null,
        verificationCodeExpiry: null,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Set httpOnly cookies
    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    return {
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async login(loginDto: LoginDto, res: Response) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException('Please verify your email first');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Set httpOnly cookies
    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    return {
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        faculty: user.faculty,
        avatar: user.avatar,
      },
    };
  }

  async resendVerificationCode(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    // Check if email is configured
    if (!this.isEmailConfigured || !this.transporter) {
      throw new BadRequestException(
        'Email service is not configured. Please contact administrator or check SMTP settings in .env file.'
      );
    }

    // ЗАЩИТА ОТ СПАМА: проверяем, прошло ли 5 минут с последней отправки
    const RESEND_COOLDOWN_MS = 5 * 60 * 1000; // 5 минут в миллисекундах
    const now = new Date();

    if (user.lastCodeSentAt) {
      const timeSinceLastSent = now.getTime() - user.lastCodeSentAt.getTime();
      const remainingTime = RESEND_COOLDOWN_MS - timeSinceLastSent;

      if (timeSinceLastSent < RESEND_COOLDOWN_MS) {
        const remainingSeconds = Math.ceil(remainingTime / 1000);
        const remainingMinutes = Math.floor(remainingSeconds / 60);
        const remainingSecondsDisplay = remainingSeconds % 60;

        throw new BadRequestException(
          `Please wait ${remainingMinutes}:${remainingSecondsDisplay.toString().padStart(2, '0')} before requesting a new code`
        );
      }
    }

    // Generate new cryptographically secure verification code
    const verificationCode = this.generateSecureVerificationCode();
    const verificationCodeExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Обновляем код и время последней отправки
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode,
        verificationCodeExpiry,
        lastCodeSentAt: now,
      },
    });

    // Send verification email
    try {
      await this.sendVerificationEmail(email, verificationCode);
      // SECURITY FIX: Don't log email addresses (PII) - use user ID instead
      this.logger.log(`Verification code resent for user: ${user.id}`);
      return {
        message: 'Verification code sent to your email',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // SECURITY FIX: Don't log email addresses (PII) - use user ID instead
      this.logger.error(`Failed to resend verification email for user: ${user.id}`, error);

      // Log detailed error
      if (error instanceof Error) {
        this.logger.error('Error details:', {
          message: error.message,
          code: (error as any).code,
          responseCode: (error as any).responseCode,
        });
      }

      throw new BadRequestException(
        `Failed to send verification email: ${errorMessage}. Please check your SMTP configuration.`
      );
    }
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('refreshToken.secret'),
      });

      const tokens = await this.generateTokens(payload.sub, payload.email, payload.role);

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        faculty: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user;
  }

  /**
   * Logout user - add token to blacklist and clear cookies
   * @param req - Express Request object (to extract token)
   * @param res - Express Response object (to clear cookies)
   */
  async logout(req: Request, res: Response) {
    // Extract token from cookie or Authorization header
    let token = null;
    if (req.cookies && req.cookies['access_token']) {
      token = req.cookies['access_token'];
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7);
    }

    // Add token to blacklist if found
    if (token) {
      try {
        // Decode token to get expiration time
        const decoded = this.jwtService.decode(token) as any;
        if (decoded && decoded.exp) {
          await this.jwtBlacklistService.addToBlacklist(token, decoded.exp);
        }
      } catch (error) {
        // If token is invalid/expired, no need to blacklist
        this.logger.error('Error blacklisting token on logout:', error);
      }
    }

    // Clear auth cookies
    this.clearAuthCookies(res);

    return {
      message: 'Logged out successfully',
    };
  }

  /**
   * Set httpOnly cookies for access and refresh tokens
   * @param res - Express Response object
   * @param accessToken - JWT access token
   * @param refreshToken - JWT refresh token
   */
  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    const isDevelopment = this.configService.get('nodeEnv') === 'development';

    // Access token cookie (httpOnly, secure in production, sameSite strict in production)
    // Dev mode uses lax + no secure to support Vite proxy (HTTPS frontend -> HTTP backend via proxy)
    res.cookie('access_token', accessToken, {
      httpOnly: true, // Cannot be accessed by client-side JavaScript (XSS protection)
      secure: !isDevelopment, // HTTPS only in production, allow HTTP in dev for Vite proxy
      sameSite: isDevelopment ? 'lax' : 'strict', // Strict CSRF protection in production
      maxAge: 60 * 60 * 1000, // 1 hour (matches JWT expiration)
      path: '/',
    });

    // Refresh token cookie (httpOnly, secure in production, sameSite strict in production)
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: !isDevelopment, // HTTPS only in production
      sameSite: isDevelopment ? 'lax' : 'strict', // Strict CSRF protection in production
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (matches refresh token expiration)
      path: '/',
    });
  }

  /**
   * Clear authentication cookies
   * @param res - Express Response object
   */
  private clearAuthCookies(res: Response) {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });
  }

  async validateUser(userId: string, email: string, role: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid user');
    }
    return user;
  }

  /**
   * Generate a cryptographically secure 6-digit verification code
   * Uses crypto.randomBytes() instead of Math.random() for security
   */
  private generateSecureVerificationCode(): string {
    // Generate random bytes and convert to a 6-digit number
    // We need 3 bytes (24 bits) to get numbers up to 16,777,215
    const randomBuffer = crypto.randomBytes(3);
    const randomNumber = randomBuffer.readUIntBE(0, 3);

    // Ensure it's a 6-digit number (100000-999999)
    const code = (randomNumber % 900000) + 100000;

    return code.toString();
  }

  /**
   * SECURITY FIX: Constant-time string comparison
   * Prevents timing attacks that could leak information about correct values
   * Uses crypto.timingSafeEqual for cryptographically secure comparison
   */
  private constantTimeCompare(a: string, b: string): boolean {
    // Handle null/undefined cases
    if (!a || !b) {
      return false;
    }

    // Normalize lengths - if different, comparison will fail but still take constant time
    // Pad shorter string with zeros to match length
    const maxLength = Math.max(a.length, b.length);
    const bufferA = Buffer.from(a.padEnd(maxLength, '\0'));
    const bufferB = Buffer.from(b.padEnd(maxLength, '\0'));

    try {
      // timingSafeEqual requires buffers of same length
      return crypto.timingSafeEqual(bufferA, bufferB) && a.length === b.length;
    } catch {
      // If any error occurs, return false
      return false;
    }
  }

  /**
   * Check SMTP configuration status (for debugging)
   * Returns information about email service configuration
   */
  getEmailServiceStatus() {
    const smtpHost = this.configService.get('email.smtp.host');
    const smtpPort = this.configService.get('email.smtp.port');
    const smtpUser = this.configService.get('email.smtp.user');
    const emailFrom = this.configService.get('email.from');

    return {
      configured: this.isEmailConfigured,
      hasTransporter: !!this.transporter,
      smtpHost: smtpHost || 'Not set',
      smtpPort: smtpPort || 'Not set',
      smtpUser: smtpUser ? `${smtpUser.substring(0, 3)}***` : 'Not set', // Partially hide email
      emailFrom: emailFrom || smtpUser || 'Not set',
      message: this.isEmailConfigured
        ? 'Email service is configured and ready'
        : 'Email service is not configured. Please check SMTP settings in .env file.',
    };
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.secret'),
        expiresIn: this.configService.get('jwt.expiresIn'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('refreshToken.secret'),
        expiresIn: this.configService.get('refreshToken.expiresIn'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async sendVerificationEmail(email: string, code: string): Promise<void> {
    // Check if email is configured
    if (!this.isEmailConfigured || !this.transporter) {
      const error = new Error('Email service is not configured. Please check SMTP settings in .env file.');
      this.logger.error('Cannot send email:', error.message);
      throw error;
    }

    const emailFrom = this.configService.get('email.from') || this.configService.get('email.smtp.user');

    if (!emailFrom) {
      const error = new Error('EMAIL_FROM is not configured in .env file');
      this.logger.error('Cannot send email:', error.message);
      throw error;
    }

    const mailOptions = {
      from: `"MNU Events" <${emailFrom}>`, // Format: "Name" <email>
      to: email,
      subject: 'MNU Events - Email Verification Code',
      html: `
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
      `,
      // Plain text version for email clients that don't support HTML
      text: `
MNU Events - Email Verification

Welcome to MNU Events!

Your verification code is: ${code}

This code will expire in 24 hours.

If you didn't request this code, please ignore this email.

Best regards,
MNU Events Team
Maqsut Narikbayev University
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      // SECURITY FIX: Don't log recipient email address (PII)
      this.logger.log('Email sent successfully:', {
        messageId: info.messageId,
        from: emailFrom,
      });
    } catch (error) {
      // Enhanced error logging
      const errorDetails = {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any).code,
        responseCode: (error as any).responseCode,
        command: (error as any).command,
        response: (error as any).response,
        stack: error instanceof Error ? error.stack : undefined,
      };

      this.logger.error('Email sending failed:', errorDetails);
      
      // Provide more helpful error messages
      if ((error as any).code === 'EAUTH') {
        throw new Error('SMTP authentication failed. Please check SMTP_USER and SMTP_PASSWORD in .env file.');
      } else if ((error as any).code === 'ECONNECTION') {
        throw new Error(`Cannot connect to SMTP server ${this.configService.get('email.smtp.host')}. Please check SMTP_HOST and SMTP_PORT.`);
      } else if ((error as any).code === 'ETIMEDOUT') {
        throw new Error('SMTP connection timeout. Please check your network connection and SMTP settings.');
      } else {
        throw new Error(`Failed to send email: ${errorDetails.message}`);
      }
    }
  }
}
