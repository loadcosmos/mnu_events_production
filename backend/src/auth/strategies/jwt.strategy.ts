import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtBlacklistService } from '../jwt-blacklist.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Extract JWT from httpOnly cookie or Authorization header (fallback for API clients)
 */
const cookieExtractor = (req: Request): string | null => {
  let token = null;

  // First, try to get token from httpOnly cookie
  if (req && req.cookies) {
    token = req.cookies['access_token'];
  }

  // Fallback to Authorization header (for backward compatibility)
  if (!token && req && req.headers) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  return token;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private jwtBlacklistService: JwtBlacklistService,
  ) {
    super({
      jwtFromRequest: cookieExtractor,
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
      passReqToCallback: true, // Pass request to validate method
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    // Extract token from request for blacklist check
    const token = cookieExtractor(req);

    if (!token) {
      throw new UnauthorizedException('Token not found');
    }

    // Check if token is blacklisted (for logout/revocation)
    const isBlacklisted = await this.jwtBlacklistService.isBlacklisted(token);
    if (isBlacklisted) {
      throw new UnauthorizedException('Token has been revoked');
    }

    // Verify user still exists (no longer doing this on EVERY request - cached in JWT)
    // Only fetch full user data if needed, otherwise trust the JWT payload
    // This significantly improves performance by avoiding DB lookups

    // For critical operations, you can still validate user exists:
    // const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    // if (!user || !user.emailVerified) throw new UnauthorizedException();

    return {
      id: payload.sub,
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
