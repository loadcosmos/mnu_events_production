import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class PaymentWebhookDto {
  @ApiProperty({
    description: 'Transaction ID from payment gateway',
    example: 'txn_1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @ApiProperty({
    description: 'Payment status',
    enum: ['success', 'failed', 'declined'],
    example: 'success',
  })
  @IsString()
  @IsIn(['success', 'failed', 'declined'])
  status: 'success' | 'failed' | 'declined';
}
