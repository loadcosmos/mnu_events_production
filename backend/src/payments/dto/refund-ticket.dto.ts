import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class RefundTicketDto {
  @ApiProperty({
    description: 'Reason for refund',
    example: 'Event cancelled',
    required: false,
  })
  @IsString()
  @IsOptional()
  reason?: string;
}
