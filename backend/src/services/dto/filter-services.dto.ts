import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsNumber, IsString, Min } from 'class-validator';
import { ServiceType, ServiceCategory } from '@prisma/client';
import { Type } from 'class-transformer';

export class FilterServicesDto {
  @ApiProperty({
    description: 'Service type filter',
    enum: ServiceType,
    required: false,
  })
  @IsEnum(ServiceType)
  @IsOptional()
  type?: ServiceType;

  @ApiProperty({
    description: 'Service category filter',
    enum: ServiceCategory,
    required: false,
  })
  @IsEnum(ServiceCategory)
  @IsOptional()
  category?: ServiceCategory;

  @ApiProperty({
    description: 'Minimum price filter',
    required: false,
    example: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  minPrice?: number;

  @ApiProperty({
    description: 'Maximum price filter',
    required: false,
    example: 100000,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  maxPrice?: number;

  @ApiProperty({
    description: 'Minimum rating filter (0-5)',
    required: false,
    example: 4.0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  minRating?: number;

  @ApiProperty({
    description: 'Search query (title or description)',
    required: false,
    example: 'logo design',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    description: 'Page number',
    required: false,
    default: 1,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiProperty({
    description: 'Items per page',
    required: false,
    default: 20,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
