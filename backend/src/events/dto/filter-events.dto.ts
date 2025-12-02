import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsDateString } from 'class-validator';
import { Category, EventStatus } from '@prisma/client';

export class FilterEventsDto {
  @ApiPropertyOptional({ enum: Category })
  @IsEnum(Category)
  @IsOptional()
  category?: Category;

  @ApiPropertyOptional({ enum: EventStatus })
  @IsEnum(EventStatus)
  @IsOptional()
  status?: EventStatus;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  startDateFrom?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  startDateTo?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  creatorId?: string;

  @ApiPropertyOptional({
    description: 'Comma-separated CSI tags (CREATIVITY,SERVICE,INTELLIGENCE)'
  })
  @IsString()
  @IsOptional()
  csiTags?: string;
}
