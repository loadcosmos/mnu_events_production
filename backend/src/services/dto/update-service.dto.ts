import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  MaxLength,
  IsUrl,
} from 'class-validator';
import { ServiceType, ServiceCategory, PriceType } from '@prisma/client';

export class UpdateServiceDto {
  @ApiProperty({
    description: 'Service type',
    enum: ServiceType,
    required: false,
  })
  @IsEnum(ServiceType)
  @IsOptional()
  type?: ServiceType;

  @ApiProperty({
    description: 'Service title',
    maxLength: 200,
    required: false,
  })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Service description',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Service category',
    enum: ServiceCategory,
    required: false,
  })
  @IsEnum(ServiceCategory)
  @IsOptional()
  category?: ServiceCategory;

  @ApiProperty({
    description: 'Service price',
    minimum: 0,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiProperty({
    description: 'Price type',
    enum: PriceType,
    required: false,
  })
  @IsEnum(PriceType)
  @IsOptional()
  priceType?: PriceType;

  @ApiProperty({
    description: 'Service image URL',
    required: false,
  })
  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({
    description: 'Is service active/visible',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
