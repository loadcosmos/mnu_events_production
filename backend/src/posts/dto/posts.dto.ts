import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, MaxLength, MinLength, IsBoolean, IsArray } from 'class-validator';
import { PostType } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreatePostDto {
    @ApiProperty({ description: 'Post content', example: 'Hello everyone!' })
    @IsString()
    @MinLength(1)
    @MaxLength(5000)
    content: string;

    @ApiProperty({ description: 'Image URL (optional)', required: false })
    @IsOptional()
    @IsString()
    imageUrl?: string;

    @ApiProperty({ description: 'Post type', enum: PostType, default: 'STUDENT_POST' })
    @IsOptional()
    @IsEnum(PostType)
    type?: PostType;

    @ApiProperty({ description: 'Pin post (Admin/Moderator only)', required: false, default: false })
    @IsOptional()
    @IsBoolean()
    isPinned?: boolean;
}

export class GetPostsQueryDto {
    @ApiProperty({ description: 'Page number', required: false, default: 1 })
    @IsOptional()
    @Type(() => Number)
    page?: number;

    @ApiProperty({ description: 'Posts per page', required: false, default: 20 })
    @IsOptional()
    @Type(() => Number)
    limit?: number;

    @ApiProperty({
        description: 'Filter by post type (can be multiple)',
        enum: PostType,
        isArray: true,
        required: false
    })
    @IsOptional()
    @IsArray()
    @IsEnum(PostType, { each: true })
    type?: PostType[];
}

export class UpdatePostDto {
    @ApiProperty({ description: 'Post content', required: false })
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(5000)
    content?: string;

    @ApiProperty({ description: 'Image URL', required: false })
    @IsOptional()
    @IsString()
    imageUrl?: string;
}

export class ModeratePostDto {
    @ApiProperty({ description: 'New status', enum: ['APPROVED', 'REJECTED'] })
    @IsEnum(['APPROVED', 'REJECTED'] as const)
    status: 'APPROVED' | 'REJECTED';
}

export class CreateCommentDto {
    @ApiProperty({ description: 'Comment content' })
    @IsString()
    @MinLength(1)
    @MaxLength(1000)
    content: string;
}
