import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
  IsOptional,
  IsArray,
} from 'class-validator';
import { Category, CsiCategory, EventStatus } from '@prisma/client';

export class CreateEventDto {
  @ApiProperty({ example: 'Hackathon 2024' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Annual coding competition for students' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: Category, example: Category.TECH })
  @IsEnum(Category)
  category: Category;

  @ApiPropertyOptional({
    enum: CsiCategory,
    isArray: true,
    example: [CsiCategory.CREATIVITY, CsiCategory.INTELLIGENCE]
  })
  @IsArray()
  @IsEnum(CsiCategory, { each: true })
  @IsOptional()
  csiTags?: CsiCategory[];

  @ApiProperty({ example: 'Main Hall, Building A' })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({ example: '2024-12-15T10:00:00Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2024-12-15T18:00:00Z' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(1)
  capacity: number;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ enum: EventStatus, example: EventStatus.UPCOMING })
  @IsEnum(EventStatus)
  @IsOptional()
  status?: EventStatus;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  isPaid?: boolean;

  @ApiPropertyOptional({ example: 5000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;
}
