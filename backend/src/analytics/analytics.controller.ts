import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '@prisma/client';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get dashboard statistics (ADMIN only)' })
  @ApiResponse({
    status: 200,
    description: 'Overall platform statistics',
  })
  async getDashboardStats() {
    return this.analyticsService.getDashboardStats();
  }

  @Get('organizer/:userId')
  @Roles(Role.ORGANIZER, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get organizer statistics (own or ADMIN)',
  })
  @ApiResponse({
    status: 200,
    description: 'Organizer event statistics',
  })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getOrganizerStats(
    @Param('userId') userId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.analyticsService.getOrganizerStats(
      userId,
      req.user.sub,
      req.user.role,
    );
  }

  @Get('student/:userId')
  @Roles(Role.STUDENT, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get student statistics (own or ADMIN)',
  })
  @ApiResponse({
    status: 200,
    description: 'Student activity statistics and badges',
  })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getStudentStats(
    @Param('userId') userId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.analyticsService.getStudentStats(
      userId,
      req.user.sub,
      req.user.role,
    );
  }

  @Get('revenue')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get revenue statistics (ADMIN only)' })
  @ApiResponse({
    status: 200,
    description: 'Platform revenue statistics',
  })
  async getRevenueStats() {
    return this.analyticsService.getRevenueStats();
  }

  @Get('event/:id')
  @Roles(Role.ORGANIZER, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get detailed event statistics',
  })
  @ApiResponse({
    status: 200,
    description: 'Event statistics with registrations and revenue',
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async getEventStats(@Param('id') id: string) {
    return this.analyticsService.getEventStats(id);
  }

  @Get('student/:userId/csi')
  @Roles(Role.STUDENT, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get student CSI (Creativity, Service, Intelligence) statistics',
  })
  @ApiResponse({
    status: 200,
    description: 'Student CSI participation breakdown with event counts',
  })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getStudentCsiStats(
    @Param('userId') userId: string,
    @Request() req: RequestWithUser,
  ) {
    // Ensure students can only view their own stats (unless ADMIN)
    if (req.user.role !== Role.ADMIN && req.user.sub !== userId) {
      throw new ForbiddenException('You can only view your own CSI statistics');
    }

    return this.analyticsService.getStudentCsiStats(userId);
  }
}
