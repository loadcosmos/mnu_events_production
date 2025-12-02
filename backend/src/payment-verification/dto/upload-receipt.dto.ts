import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsUrl } from 'class-validator';

export class UploadReceiptDto {
  @ApiProperty({
    description: 'Ticket ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  ticketId: string;

  @ApiProperty({
    description: 'Receipt image URL (uploaded to storage)',
    example: 'https://storage.example.com/receipts/receipt123.jpg',
  })
  @IsUrl()
  receiptImageUrl: string;
}
