import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  Min,
  MaxLength,
  IsUrl,
  MinLength,
  Matches,
} from 'class-validator';
import { ServiceType, ServiceCategory, PriceType } from '@prisma/client';

export class CreateServiceDto {
  @ApiProperty({
    description: 'Service type',
    enum: ServiceType,
    example: 'GENERAL',
  })
  @IsEnum(ServiceType)
  type: ServiceType;

  @ApiProperty({
    description: 'Service title',
    example: 'Professional Logo Design',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({
    description: 'Service description',
    example:
      'I will create a professional logo for your business with unlimited revisions',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(100, { message: 'Description must be at least 100 characters long' })
  @MaxLength(5000)
  @Matches(/^(?!.*(.)\1{5,})/, {
    message: 'Description contains too many repeated characters',
  })
  description: string;

  @ApiProperty({
    description: 'Service category',
    enum: ServiceCategory,
    example: 'DESIGN',
  })
  @IsEnum(ServiceCategory)
  category: ServiceCategory;

  @ApiProperty({
    description: 'Service price',
    example: 15000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'Price type',
    enum: PriceType,
    example: 'FIXED',
  })
  @IsEnum(PriceType)
  priceType: PriceType;

  @ApiProperty({
    description: 'Service image URL',
    example: 'https://example.com/image.jpg',
    required: false,
  })
  @IsUrl()
  @IsOptional()
  imageUrl?: string;
}
