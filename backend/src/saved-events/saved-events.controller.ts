import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SavedEventsService } from './saved-events.service';

@ApiTags('Saved Events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('saved-events')
export class SavedEventsController {
    constructor(private readonly savedEventsService: SavedEventsService) { }

    @Get()
    @ApiOperation({ summary: 'Get my saved events' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiResponse({ status: 200, description: 'Saved events list' })
    async findMySaved(
        @CurrentUser() user: any,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.savedEventsService.findByUser(user.id, page || 1, limit || 20);
    }

    @Get(':eventId/status')
    @ApiOperation({ summary: 'Check if event is saved' })
    @ApiResponse({ status: 200, description: 'Save status' })
    async checkStatus(
        @Param('eventId') eventId: string,
        @CurrentUser() user: any,
    ) {
        const saved = await this.savedEventsService.isSaved(eventId, user.id);
        return { saved };
    }

    @Post(':eventId')
    @ApiOperation({ summary: 'Save an event' })
    @ApiResponse({ status: 201, description: 'Event saved' })
    async save(
        @Param('eventId') eventId: string,
        @CurrentUser() user: any,
    ) {
        return this.savedEventsService.save(eventId, user.id);
    }

    @Delete(':eventId')
    @ApiOperation({ summary: 'Unsave an event' })
    @ApiResponse({ status: 200, description: 'Event unsaved' })
    async unsave(
        @Param('eventId') eventId: string,
        @CurrentUser() user: any,
    ) {
        return this.savedEventsService.unsave(eventId, user.id);
    }
}
