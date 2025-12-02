import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';

/**
 * JWT Blacklist Service
 *
 * Manages blacklisted JWT tokens to enable token revocation.
 * When a user logs out or when we need to invalidate a token,
 * we add it to the blacklist stored in Redis.
 *
 * The blacklist uses TTL (Time To Live) equal to the token's
 * remaining validity period, so expired tokens are automatically
 * removed from Redis.
 */
@Injectable()
export class JwtBlacklistService {
  private readonly jwtExpirationSeconds: number;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
  ) {
    // Parse JWT expiration from config (e.g., '1h' -> 3600 seconds)
    const jwtExpiration = this.configService.get<string>('jwt.expiresIn') || '1h';
    this.jwtExpirationSeconds = this.parseExpirationToSeconds(jwtExpiration);
  }

  /**
   * Add a JWT token to the blacklist
   * @param token - The JWT token to blacklist
   * @param exp - Token expiration timestamp (in seconds since epoch)
   */
  async addToBlacklist(token: string, exp: number): Promise<void> {
    const currentTime = Math.floor(Date.now() / 1000);
    const ttl = exp - currentTime;

    // Only add to blacklist if token hasn't expired yet
    if (ttl > 0) {
      // Store in Redis with TTL equal to remaining token validity
      await this.cacheManager.set(
        `blacklist:${token}`,
        'revoked',
        ttl * 1000, // Convert to milliseconds for cache-manager
      );
    }
  }

  /**
   * Check if a token is blacklisted
   * @param token - The JWT token to check
   * @returns true if token is blacklisted, false otherwise
   */
  async isBlacklisted(token: string): Promise<boolean> {
    const result = await this.cacheManager.get(`blacklist:${token}`);
    return result !== null && result !== undefined;
  }

  /**
   * Remove a token from the blacklist (rare use case)
   * @param token - The JWT token to remove from blacklist
   */
  async removeFromBlacklist(token: string): Promise<void> {
    await this.cacheManager.del(`blacklist:${token}`);
  }

  /**
   * Parse expiration string (e.g., '1h', '7d') to seconds
   * @param expiration - Expiration string from config
   * @returns Expiration in seconds
   */
  private parseExpirationToSeconds(expiration: string): number {
    const units: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };

    const match = expiration.match(/^(\d+)([smhd])$/);
    if (!match) {
      // Default to 1 hour if parsing fails
      return 3600;
    }

    const [, value, unit] = match;
    return parseInt(value, 10) * units[unit];
  }

  /**
   * Clear all blacklisted tokens (use with caution, mainly for testing)
   * Note: Tokens automatically expire via TTL, so manual clearing is rarely needed
   */
  async clearAll(): Promise<void> {
    // cache-manager v5+ doesn't support reset()
    // Blacklisted tokens will automatically expire based on their TTL
    // For manual clearing, you would need to use Redis-specific commands
    // This is intentionally left as a no-op since TTL handles cleanup
  }
}
