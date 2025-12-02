import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CheckinService } from './checkin.service';
import { ValidateTicketDto } from './dto/validate-ticket.dto';
import { ValidateStudentDto } from './dto/validate-student.dto';
import { GenerateEventQRDto } from './dto/checkin-stats.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '@prisma/client';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';

@ApiTags('Check-In')
@Controller('checkin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CheckinController {
  constructor(private readonly checkinService: CheckinService) { }

  @Post('validate-ticket')
  @Roles(Role.ORGANIZER, Role.EXTERNAL_PARTNER, Role.MODERATOR, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'MODE 1: Organizer/Partner scans student ticket QR code (for paid events)',
  })
  @ApiResponse({
    status: 200,
    description: 'Ticket validated successfully, check-in created',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid QR code or ticket already used',
  })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Ticket or event not found' })
  @ApiResponse({
    status: 409,
    description: 'Ticket already used',
  })
  async validateTicket(
    @Body() dto: ValidateTicketDto,
    @Request() req: RequestWithUser,
  ) {
    return this.checkinService.validateTicket(dto, req.user.sub);
  }

  @Post('validate-student')
  @Roles(Role.STUDENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'MODE 2: Student scans event QR code (for free events/lectures)',
  })
  @ApiResponse({
    status: 200,
    description: 'Student checked in successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid QR code, expired, or rate limit exceeded',
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiResponse({
    status: 409,
    description: 'Student already checked in',
  })
  async validateStudent(
    @Body() dto: ValidateStudentDto,
    @Request() req: RequestWithUser,
  ) {
    return this.checkinService.validateStudent(dto, req.user.sub);
  }

  @Get('event/:id/stats')
  @Roles(Role.ORGANIZER, Role.EXTERNAL_PARTNER, Role.MODERATOR, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get check-in statistics for an event' })
  @ApiResponse({
    status: 200,
    description: 'Check-in statistics',
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async getEventStats(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.checkinService.getEventStats(id, req.user.sub, req.user.role);
  }

  @Get('event/:id/list')
  @Roles(Role.ORGANIZER, Role.EXTERNAL_PARTNER, Role.MODERATOR, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get list of all check-ins for an event' })
  @ApiResponse({
    status: 200,
    description: 'List of check-ins with user details',
  })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async getCheckInList(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.checkinService.getCheckInList(id, req.user.sub);
  }

  @Post('generate-event-qr')
  @Roles(Role.ORGANIZER, Role.EXTERNAL_PARTNER, Role.MODERATOR, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Generate QR code for event (MODE 2: students scan)',
  })
  @ApiResponse({
    status: 200,
    description: 'QR code generated successfully',
  })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async generateEventQR(
    @Body() dto: GenerateEventQRDto,
    @Request() req: RequestWithUser,
  ) {
    return this.checkinService.generateEventQR(dto, req.user.sub);
  }
}
