import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CheckInStatsDto {
  @ApiProperty({
    description: 'Total number of check-ins for the event',
    example: 45,
  })
  totalCheckIns: number;

  @ApiProperty({
    description: 'Total tickets sold (for paid events)',
    example: 50,
  })
  totalTickets?: number;

  @ApiProperty({
    description: 'Total registrations (for free events)',
    example: 60,
  })
  totalRegistrations?: number;

  @ApiProperty({
    description: 'Check-in rate as percentage',
    example: 75.5,
  })
  checkInRate: number;

  @ApiProperty({
    description: 'Event capacity',
    example: 100,
  })
  capacity: number;

  @ApiProperty({
    description: 'Check-in mode for the event',
    enum: ['ORGANIZER_SCANS', 'STUDENTS_SCAN'],
  })
  checkInMode: string;
}

export class GenerateEventQRDto {
  @ApiProperty({
    description: 'Event ID to generate QR code for',
    example: 'clq1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  eventId: string;

  @ApiProperty({
    description: 'QR code expiry in hours (default: 24)',
    example: 24,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  expiryHours?: number;
}

export class GenerateEventQRResponseDto {
  @ApiProperty({
    description: 'Generated QR code as base64 data URL',
  })
  qrCode: string;

  @ApiProperty({
    description: 'QR code expiry timestamp',
  })
  expiresAt: Date;
}
