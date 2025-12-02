import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ModerationService } from './moderation.service';
import { ModeratorGuard } from '../auth/guards/moderator.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ModerationStatus, ModerationType } from '@prisma/client';

@Controller('moderation')
@UseGuards(JwtAuthGuard, ModeratorGuard)
export class ModerationController {
    constructor(private readonly moderationService: ModerationService) { }

    @Get('queue')
    getQueue(
        @Query('status') status?: ModerationStatus,
        @Query('type') type?: ModerationType,
    ) {
        return this.moderationService.getQueue(status, type);
    }

    @Get('stats')
    getStats() {
        return this.moderationService.getStats();
    }

    @Post(':id/approve')
    approve(@Param('id') id: string, @Request() req: any) {
        return this.moderationService.approve(id, req.user.id);
    }

    @Post(':id/reject')
    reject(
        @Param('id') id: string,
        @Body('reason') reason: string,
        @Request() req: any,
    ) {
        return this.moderationService.reject(id, req.user.id, reason);
    }
}
