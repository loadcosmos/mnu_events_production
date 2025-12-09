import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, MaxLength, MinLength } from 'class-validator';
import { PostType } from '@prisma/client';

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
