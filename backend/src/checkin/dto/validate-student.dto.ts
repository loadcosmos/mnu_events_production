import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ValidateStudentDto {
  @ApiProperty({
    description: 'Event QR code data (from event QR)',
    example: '{"eventId":"clq123...","timestamp":1234567890,"signature":"abc123..."}',
  })
  @IsString()
  @IsNotEmpty()
  qrData: string;

  @ApiProperty({
    description: 'Optional: User location coordinates for proximity check',
    example: '{"latitude":43.2384,"longitude":76.8893}',
    required: false,
  })
  @IsString()
  @IsOptional()
  location?: string;
}

export class ValidateStudentResponseDto {
  success: boolean;
  message: string;
  checkIn?: {
    id: string;
    eventId: string;
    checkedInAt: Date;
  };
}
