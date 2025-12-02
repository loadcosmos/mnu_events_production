import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUrl, IsEnum, IsNumber, IsPositive, IsOptional, Min } from 'class-validator';
import { AdPosition } from '@prisma/client';

export class CreateAdDto {
  @ApiProperty({
    description: 'Advertisement title',
    example: 'Student Discount at Coffee Shop',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Image URL for the advertisement',
    example: 'https://example.com/ad-image.jpg',
  })
  @IsUrl()
  imageUrl: string;

  @ApiProperty({
    description: 'Link URL (optional)',
    example: 'https://coffeeshop.com/student-discount',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  linkUrl?: string;

  @ApiProperty({
    description: 'Advertisement position',
    enum: AdPosition,
    example: 'TOP_BANNER',
  })
  @IsEnum(AdPosition)
  position: AdPosition;

  @ApiProperty({
    description: 'Duration in weeks',
    example: 4,
    minimum: 1,
  })
  @IsNumber()
  @IsPositive()
  @Min(1)
  duration: number;
}
