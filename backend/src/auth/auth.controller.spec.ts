import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UnauthorizedException } from '@nestjs/common';
import { Request, Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    verifyEmail: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    refreshTokens: jest.fn(),
    resendVerificationCode: jest.fn(),
    getProfile: jest.fn(),
  };

  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = {
      cookies: {},
      headers: {},
    };

    mockRes = {
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('logout', () => {
    it('should call authService.logout and return success message', async () => {
      const expectedResult = { message: 'Logged out successfully' };
      mockAuthService.logout.mockResolvedValue(expectedResult);

      await controller.logout(mockReq as Request, mockRes as Response);

      expect(authService.logout).toHaveBeenCalledWith(mockReq, mockRes);
      expect(mockRes.json).toHaveBeenCalledWith(expectedResult);
    });

    it('should return correct logout message format', async () => {
      const expectedResult = { message: 'Logged out successfully' };
      mockAuthService.logout.mockResolvedValue(expectedResult);

      await controller.logout(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Logged out successfully'
      }));
    });
  });

  describe('login', () => {
    it('should call authService.login with correct credentials', async () => {
      const loginDto = {
        email: 'test@kazguu.kz',
        password: 'Password123!',
      };
      const expectedResult = {
        user: { id: '1', email: 'test@kazguu.kz' },
      };
      mockAuthService.login.mockResolvedValue(expectedResult);

      await controller.login(loginDto, mockRes as Response);

      expect(authService.login).toHaveBeenCalledWith(loginDto, mockRes);
      expect(mockRes.json).toHaveBeenCalledWith(expectedResult);
    });
  });

  describe('getProfile', () => {
    it('should call authService.getProfile with user id', async () => {
      const mockUser = { id: '1', email: 'test@kazguu.kz' };
      const expectedResult = { id: '1', email: 'test@kazguu.kz' };
      mockAuthService.getProfile.mockResolvedValue(expectedResult);

      const result = await controller.getProfile(mockUser);

      expect(authService.getProfile).toHaveBeenCalledWith('1');
      expect(result).toEqual(expectedResult);
    });
  });
});

