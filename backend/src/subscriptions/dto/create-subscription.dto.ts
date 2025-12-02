import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsPositive, IsOptional } from 'class-validator';
import { SubscriptionType } from '@prisma/client';

export class CreateSubscriptionDto {
  @ApiProperty({
    description: 'Subscription type',
    enum: SubscriptionType,
    example: 'PREMIUM',
  })
  @IsEnum(SubscriptionType)
  type: SubscriptionType;

  @ApiProperty({
    description: 'Subscription duration in months',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  durationMonths?: number;
}
