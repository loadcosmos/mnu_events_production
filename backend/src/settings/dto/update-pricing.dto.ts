import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, Min } from 'class-validator';

export class UpdatePricingDto {
  @ApiProperty({
    description: 'Base price for event listing (тг)',
    example: 5000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsPositive()
  basePrice: number;

  @ApiProperty({
    description: 'Premium price for event listing (тг)',
    example: 10000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsPositive()
  premiumPrice: number;

  @ApiProperty({
    description: 'Package price for 5 events (тг)',
    example: 20000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsPositive()
  packagePrice: number;
}
