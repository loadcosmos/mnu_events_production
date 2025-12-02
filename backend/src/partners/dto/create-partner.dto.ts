import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsNotEmpty, Matches, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePartnerDto {
  @ApiProperty({
    description: 'User ID (must have role EXTERNAL_PARTNER)',
    example: 'clxxx-uuid-xxxx',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Company name',
    example: 'IT Academy Kazakhstan',
  })
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @ApiProperty({
    description: 'Business Identification Number (БИН)',
    example: '123456789012',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{12}$/, { message: 'БИН должен состоять из 12 цифр' })
  bin: string;

  @ApiProperty({
    description: 'Contact person full name',
    example: 'Иванов Иван Иванович',
  })
  @IsString()
  @IsNotEmpty()
  contactPerson: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+7 777 123 45 67',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    description: 'Email address',
    example: 'contact@itacademy.kz',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'WhatsApp number',
    example: '+7 777 123 45 67',
  })
  @IsString()
  @IsNotEmpty()
  whatsapp: string;

  @ApiProperty({
    description: 'Kaspi phone number for receiving payments',
    example: '+7 777 123 45 67',
  })
  @IsString()
  @IsNotEmpty()
  kaspiPhone: string;

  @ApiProperty({
    description: 'Kaspi account holder name',
    example: 'Иванов Иван Иванович',
  })
  @IsString()
  @IsNotEmpty()
  kaspiName: string;

  @ApiProperty({
    description: 'Custom commission rate (0-0.5 = 0%-50%). If not provided, uses default platform rate.',
    example: 0.10,
    required: false,
    minimum: 0,
    maximum: 0.5,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(0.5)
  commissionRate?: number;
}
