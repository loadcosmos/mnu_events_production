import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePlatformSettingsDto {
  @ApiPropertyOptional({
    description: 'Default commission rate (0-0.5 = 0%-50%)',
    example: 0.10,
    minimum: 0,
    maximum: 0.5,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(0.5)
  defaultCommissionRate?: number;

  @ApiPropertyOptional({
    description: 'Premium commission rate (0-0.5 = 0%-50%)',
    example: 0.07,
    minimum: 0,
    maximum: 0.5,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(0.5)
  premiumCommissionRate?: number;

  @ApiPropertyOptional({
    description: 'Price for additional event slot (₸)',
    example: 3000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  additionalEventPrice?: number;

  @ApiPropertyOptional({
    description: 'Premium subscription price per month (₸)',
    example: 15000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  premiumSubscriptionPrice?: number;

  @ApiPropertyOptional({
    description: 'Top banner price per week (₸)',
    example: 15000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  topBannerPricePerWeek?: number;

  @ApiPropertyOptional({
    description: 'Native feed ad price per week (₸)',
    example: 8000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  nativeFeedPricePerWeek?: number;

  @ApiPropertyOptional({
    description: 'Sidebar ad price per week (₸)',
    example: 5000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  sidebarPricePerWeek?: number;

  @ApiPropertyOptional({
    description: 'Platform Kaspi phone number',
    example: '+7 777 123 45 67',
  })
  @IsOptional()
  @IsString()
  platformKaspiPhone?: string;

  @ApiPropertyOptional({
    description: 'Platform Kaspi account name',
    example: 'Ivanov Ivan Ivanovich',
  })
  @IsOptional()
  @IsString()
  platformKaspiName?: string;
}
