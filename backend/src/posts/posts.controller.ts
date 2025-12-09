import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { PostsService } from './posts.service';
import { CreatePostDto, UpdatePostDto, ModeratePostDto, CreateCommentDto } from './dto/posts.dto';

@ApiTags('Posts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('posts')
export class PostsController {
    constructor(private readonly postsService: PostsService) { }

    @Get()
    @ApiOperation({ summary: 'Get all approved posts' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Posts list' })
    async findAll(
        @CurrentUser() user: any,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.postsService.findAll(user.id, user.role, page || 1, limit || 20);
    }

    @Get('moderation')
    @Roles(Role.MODERATOR, Role.ADMIN)
    @ApiOperation({ summary: 'Get pending posts for moderation' })
    @ApiResponse({ status: 200, description: 'Pending posts' })
    async findPending(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.postsService.findPending(page || 1, limit || 20);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new post' })
    @ApiResponse({ status: 201, description: 'Post created' })
    async create(
        @CurrentUser() user: any,
        @Body() dto: CreatePostDto,
    ) {
        return this.postsService.create(user.id, user.role, dto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a post' })
    @ApiResponse({ status: 200, description: 'Post updated' })
    async update(
        @Param('id') id: string,
        @CurrentUser() user: any,
        @Body() dto: UpdatePostDto,
    ) {
        return this.postsService.update(id, user.id, user.role, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a post' })
    @ApiResponse({ status: 200, description: 'Post deleted' })
    async delete(
        @Param('id') id: string,
        @CurrentUser() user: any,
    ) {
        return this.postsService.delete(id, user.id, user.role);
    }

    @Patch(':id/moderate')
    @Roles(Role.MODERATOR, Role.ADMIN)
    @ApiOperation({ summary: 'Approve or reject a post' })
    @ApiResponse({ status: 200, description: 'Post moderated' })
    async moderate(
        @Param('id') id: string,
        @Body() dto: ModeratePostDto,
    ) {
        return this.postsService.moderate(id, dto);
    }

    @Post(':id/like')
    @ApiOperation({ summary: 'Toggle like on a post' })
    @ApiResponse({ status: 200, description: 'Like toggled' })
    async toggleLike(
        @Param('id') id: string,
        @CurrentUser() user: any,
    ) {
        return this.postsService.toggleLike(id, user.id);
    }

    @Get(':id/comments')
    @ApiOperation({ summary: 'Get comments on a post' })
    @ApiResponse({ status: 200, description: 'Comments list' })
    async getComments(
        @Param('id') id: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.postsService.getComments(id, page || 1, limit || 20);
    }

    @Post(':id/comments')
    @ApiOperation({ summary: 'Add a comment to a post' })
    @ApiResponse({ status: 201, description: 'Comment added' })
    async addComment(
        @Param('id') id: string,
        @CurrentUser() user: any,
        @Body() dto: CreateCommentDto,
    ) {
        return this.postsService.addComment(id, user.id, dto);
    }

    @Delete(':id/comments/:commentId')
    @ApiOperation({ summary: 'Delete a comment' })
    @ApiResponse({ status: 200, description: 'Comment deleted' })
    async deleteComment(
        @Param('id') postId: string,
        @Param('commentId') commentId: string,
        @CurrentUser() user: any,
    ) {
        return this.postsService.deleteComment(postId, commentId, user.id, user.role);
    }
}
