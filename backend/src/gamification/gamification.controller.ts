import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GamificationService } from './gamification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';

@ApiTags('Gamification')
@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user gamification stats' })
  @ApiResponse({ status: 200, description: 'User stats retrieved' })
  async getMyStats(@Request() req: RequestWithUser) {
    return this.gamificationService.getUserStats(req.user.sub);
  }

  @Get('achievements')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user achievements' })
  @ApiResponse({ status: 200, description: 'User achievements retrieved' })
  async getMyAchievements(@Request() req: RequestWithUser) {
    return this.gamificationService.getUserAchievements(req.user.sub);
  }
}
