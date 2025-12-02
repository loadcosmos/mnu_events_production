import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { VerificationStatus } from '@prisma/client';

export class VerifyPaymentDto {
  @ApiProperty({
    description: 'Verification status',
    enum: VerificationStatus,
    example: 'APPROVED',
  })
  @IsEnum(VerificationStatus)
  status: VerificationStatus;

  @ApiProperty({
    description: 'Notes from organizer (required if rejecting)',
    example: 'Payment amount does not match ticket price',
    required: false,
  })
  @IsOptional()
  @IsString()
  organizerNotes?: string;
}
