import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class HealthService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async check() {
    const dbHealth = await this.checkDatabase();
    const redisHealth = await this.checkRedis();

    const isHealthy = dbHealth.status === 'up' && redisHealth.status === 'up';

    return {
      status: isHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealth,
        redis: redisHealth,
      },
    };
  }

  async readinessCheck() {
    const dbHealth = await this.checkDatabase();
    const redisHealth = await this.checkRedis();

    const isReady = dbHealth.status === 'up' && redisHealth.status === 'up';

    if (!isReady) {
      throw new Error('Service not ready');
    }

    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
    };
  }

  async livenessCheck() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }

  private async checkDatabase() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'up',
        message: 'Database connection is healthy',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        status: 'down',
        message: `Database connection failed: ${errorMessage}`,
      };
    }
  }

  private async checkRedis() {
    try {
      const testKey = 'health:check';
      await this.cacheManager.set(testKey, 'ok', 1000);
      const value = await this.cacheManager.get(testKey);

      if (value === 'ok') {
        return {
          status: 'up',
          message: 'Redis connection is healthy',
        };
      } else {
        return {
          status: 'down',
          message: 'Redis read/write test failed',
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        status: 'down',
        message: `Redis connection failed: ${errorMessage}`,
      };
    }
  }
}
