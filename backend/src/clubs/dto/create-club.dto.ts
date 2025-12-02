import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ClubCategory } from '@prisma/client';

export class CreateClubDto {
  @ApiProperty({ example: 'DSA MNU' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Data Science and Analytics club. Join us to explore the world of data, machine learning, and analytics.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: ClubCategory, example: ClubCategory.ACADEMIC })
  @IsEnum(ClubCategory)
  category: ClubCategory;

  @ApiPropertyOptional({ example: 'https://example.com/club-image.jpg' })
  @IsString()
  @IsOptional()
  imageUrl?: string;
}


