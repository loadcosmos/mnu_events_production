import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsNotEmpty, Min } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'Event ID for which to purchase a ticket',
    example: 'clq1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  eventId: string;

  @ApiProperty({
    description: 'Total amount to pay (including platform fee)',
    example: 5000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: 'Platform fee amount',
    example: 500,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  platformFee: number;
}
