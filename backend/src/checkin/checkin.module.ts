import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { CheckinController } from './checkin.controller';
import { CheckinService } from './checkin.service';
import { PrismaModule } from '../prisma/prisma.module';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [
    PrismaModule,
    GamificationModule,
    CacheModule.register(), // SECURITY FIX: Add cache for distributed rate limiting
  ],
  controllers: [CheckinController],
  providers: [CheckinService],
  exports: [CheckinService],
})
export class CheckinModule {}
