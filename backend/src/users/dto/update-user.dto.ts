import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Иван' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Иванов' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ example: 'Computer Science' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  faculty?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  avatar?: string;

  @ApiPropertyOptional({ example: 'Dean of Computer Science', description: 'Position/title for FACULTY role users' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  position?: string;
}

export class UpdateRoleDto {
  @ApiPropertyOptional({ enum: Role, example: Role.ORGANIZER })
  @IsEnum(Role, { message: 'Role must be one of: STUDENT, ORGANIZER, ADMIN' })
  role: Role;
}
