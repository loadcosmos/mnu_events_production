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
import { FollowsService } from './follows.service';

@ApiTags('Follows')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class FollowsController {
    constructor(private readonly followsService: FollowsService) { }

    @Get(':userId/followers')
    @ApiOperation({ summary: 'Get user followers' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiResponse({ status: 200, description: 'Followers list' })
    async getFollowers(
        @Param('userId') userId: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.followsService.getFollowers(userId, page || 1, limit || 20);
    }

    @Get(':userId/following')
    @ApiOperation({ summary: 'Get users that user is following' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiResponse({ status: 200, description: 'Following list' })
    async getFollowing(
        @Param('userId') userId: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.followsService.getFollowing(userId, page || 1, limit || 20);
    }

    @Get(':userId/follow-status')
    @ApiOperation({ summary: 'Check if current user follows target user' })
    @ApiResponse({ status: 200, description: 'Follow status' })
    async checkFollowStatus(
        @Param('userId') targetUserId: string,
        @CurrentUser() user: any,
    ) {
        const isFollowing = await this.followsService.isFollowing(user.id, targetUserId);
        const counts = await this.followsService.getCounts(targetUserId);
        return { isFollowing, ...counts };
    }

    @Post(':userId/follow')
    @ApiOperation({ summary: 'Follow a user' })
    @ApiResponse({ status: 201, description: 'User followed' })
    async follow(
        @Param('userId') targetUserId: string,
        @CurrentUser() user: any,
    ) {
        return this.followsService.follow(user.id, targetUserId);
    }

    @Delete(':userId/follow')
    @ApiOperation({ summary: 'Unfollow a user' })
    @ApiResponse({ status: 200, description: 'User unfollowed' })
    async unfollow(
        @Param('userId') targetUserId: string,
        @CurrentUser() user: any,
    ) {
        return this.followsService.unfollow(user.id, targetUserId);
    }
}
