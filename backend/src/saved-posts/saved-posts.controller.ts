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
import { SavedPostsService } from './saved-posts.service';

@ApiTags('Saved Posts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('saved-posts')
export class SavedPostsController {
    constructor(private readonly savedPostsService: SavedPostsService) { }

    @Get()
    @ApiOperation({ summary: 'Get user saved posts' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiResponse({ status: 200, description: 'Saved posts list' })
    async getSavedPosts(
        @CurrentUser() user: any,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.savedPostsService.getSavedPosts(user.id, page || 1, limit || 20);
    }

    @Get(':postId/status')
    @ApiOperation({ summary: 'Check if post is saved' })
    @ApiResponse({ status: 200, description: 'Save status' })
    async checkStatus(
        @CurrentUser() user: any,
        @Param('postId') postId: string,
    ) {
        return this.savedPostsService.checkStatus(user.id, postId);
    }

    @Post(':postId')
    @ApiOperation({ summary: 'Save a post' })
    @ApiResponse({ status: 201, description: 'Post saved' })
    async savePost(
        @CurrentUser() user: any,
        @Param('postId') postId: string,
    ) {
        return this.savedPostsService.savePost(user.id, postId);
    }

    @Delete(':postId')
    @ApiOperation({ summary: 'Unsave a post' })
    @ApiResponse({ status: 200, description: 'Post unsaved' })
    async unsavePost(
        @CurrentUser() user: any,
        @Param('postId') postId: string,
    ) {
        return this.savedPostsService.unsavePost(user.id, postId);
    }
}
