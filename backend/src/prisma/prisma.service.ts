import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      // Connection pooling configuration
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      // Logging configuration
      log: process.env.NODE_ENV === 'development'
        ? [
          { emit: 'event', level: 'query' },
          { emit: 'stdout', level: 'error' },
          { emit: 'stdout', level: 'warn' },
        ]
        : [
          { emit: 'stdout', level: 'error' },
        ],
    });

    // Log slow queries in development
    if (process.env.NODE_ENV === 'development') {
      (this as any).$on('query', (e: Prisma.QueryEvent) => {
        if (e.duration > 100) { // Log queries slower than 100ms
          this.logger.warn(`Slow query (${e.duration}ms): ${e.query}`);
        }
      });
    }
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Database connected successfully');
    } catch (error) {
      this.logger.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') return;

    // Clean all tables in reverse order of dependencies
    await this.registration.deleteMany({});
    await this.event.deleteMany({});
    await this.user.deleteMany({});
  }
}
