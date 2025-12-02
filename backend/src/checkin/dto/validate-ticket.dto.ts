import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsObject } from 'class-validator';

export class ValidateTicketDto {
  @ApiProperty({
    description: 'QR code data from scanned ticket (JSON string)',
    example: '{"ticketId":"clq123...","eventId":"clq456...","userId":"clq789...","timestamp":1234567890,"signature":"abc123..."}',
  })
  @IsString()
  @IsNotEmpty()
  qrData: string;

  @ApiProperty({
    description: 'Event ID to validate against',
    example: 'clq1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  eventId: string;
}

export class ValidateTicketResponseDto {
  success: boolean;
  message: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    faculty?: string;
  };
  ticket?: {
    id: string;
    price: number;
    purchasedAt: Date;
  };
  checkIn?: {
    id: string;
    checkedInAt: Date;
  };
}
