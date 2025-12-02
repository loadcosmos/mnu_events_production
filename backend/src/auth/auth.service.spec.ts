import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtBlacklistService } from './jwt-blacklist.service';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Request, Response } from 'express';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verify: jest.fn(),
    decode: jest.fn(),
  };

  const mockJwtBlacklistService = {
    addToBlacklist: jest.fn(),
    isBlacklisted: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, any> = {
        'jwt.secret': 'test-secret',
        'nodeEnv': 'test',
        'jwt.expiresIn': '15m',
        'refreshToken.secret': 'refresh-secret',
        'refreshToken.expiresIn': '7d',
        'email.smtp.host': 'smtp.test.com',
        'email.smtp.port': 587,
        'email.smtp.user': 'test@test.com',
        'email.smtp.password': 'password',
        'email.from': 'noreply@test.com',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: JwtBlacklistService,
          useValue: mockJwtBlacklistService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('logout', () => {
    it('should return success message', async () => {
      const mockReq = {
        cookies: {},
        headers: {},
      } as unknown as Request;

      const mockRes = {
        clearCookie: jest.fn(),
      } as unknown as Response;

      const result = await service.logout(mockReq, mockRes);

      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(mockRes.clearCookie).toHaveBeenCalledWith('access_token', { path: '/' });
      expect(mockRes.clearCookie).toHaveBeenCalledWith('refresh_token', { path: '/' });
    });

    it('should blacklist token if present', async () => {
      const mockReq = {
        cookies: { access_token: 'valid-token' },
        headers: {},
      } as unknown as Request;

      const mockRes = {
        clearCookie: jest.fn(),
      } as unknown as Response;

      mockJwtService.decode.mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 });

      const result = await service.logout(mockReq, mockRes);

      expect(result).toHaveProperty('message');
      expect(mockJwtBlacklistService.addToBlacklist).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const mockRes = {
      cookie: jest.fn(),
    } as unknown as Response;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'notfound@kazguu.kz',
          password: 'Password123!',
        }, mockRes),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if email not verified', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'test@kazguu.kz',
        password: 'hashed',
        emailVerified: false,
      });

      await expect(
        service.login({
          email: 'test@kazguu.kz',
          password: 'Password123!',
        }, mockRes),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should successfully login with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      const mockUser = {
        id: '1',
        email: 'test@kazguu.kz',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'STUDENT',
        emailVerified: true,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockJwtService.signAsync.mockResolvedValue('mock-access-token');

      const result = await service.login({
        email: 'test@kazguu.kz',
        password: 'Password123!',
      }, mockRes);

      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('test@kazguu.kz');
      expect(mockJwtService.signAsync).toHaveBeenCalled();
      expect(mockRes.cookie).toHaveBeenCalledTimes(2); // access_token and refresh_token
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const hashedPassword = await bcrypt.hash('CorrectPassword', 10);
      const mockUser = {
        id: '1',
        email: 'test@kazguu.kz',
        password: hashedPassword,
        emailVerified: true,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.login({
          email: 'test@kazguu.kz',
          password: 'WrongPassword',
        }, mockRes),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateUser', () => {
    it('should return user for valid userId', async () => {
      const mockUser = {
        id: '1',
        email: 'test@kazguu.kz',
        firstName: 'Test',
        lastName: 'User',
        role: 'STUDENT',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service['validateUser']('1', 'test@kazguu.kz', 'STUDENT');

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw UnauthorizedException for invalid userId', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service['validateUser']('invalid-id', 'invalid@kazguu.kz', 'STUDENT')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});

