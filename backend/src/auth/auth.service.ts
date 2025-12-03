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
import { EmailService } from '../common/services/email.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto'; // SECURITY FIX: Import full crypto module for timingSafeEqual
import { Response, Request } from 'express';
import { RegisterDto, VerifyEmailDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private jwtBlacklistService: JwtBlacklistService,
    private emailService: EmailService,
  ) {
    this.logger.log('AuthService initialized with EmailService');
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
    this.logger.log(`Email configured: ${this.emailService.isConfigured()}`);

    if (!this.emailService.isConfigured()) {
      emailError = 'Email service is not configured. Please set RESEND_API_KEY.';
      this.logger.error(`❌ Cannot send email: ${emailError}`);
    } else {
      try {
        await this.emailService.sendVerificationEmail(email, verificationCode);
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
    if (!this.emailService.isConfigured()) {
      throw new BadRequestException(
        'Email service is not configured. Please contact administrator.'
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
      await this.emailService.sendVerificationEmail(email, verificationCode);
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
    const resendApiKey = this.configService.get('RESEND_API_KEY');
    const emailFrom = this.configService.get('email.from') || 'onboarding@resend.dev';
    const configured = this.emailService.isConfigured();

    return {
      configured,
      provider: 'Resend',
      apiKeySet: !!resendApiKey,
      emailFrom,
      message: configured
        ? 'Email service is configured and ready (Resend)'
        : 'Email service is not configured. Please set RESEND_API_KEY environment variable.',
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
}
