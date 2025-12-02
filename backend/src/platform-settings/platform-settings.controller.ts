import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PlatformSettingsService } from './platform-settings.service';
import { UpdatePlatformSettingsDto } from './dto/update-platform-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Platform Settings')
@Controller('platform-settings')
export class PlatformSettingsController {
  constructor(
    private readonly platformSettingsService: PlatformSettingsService,
  ) { }

  @Get()
  @ApiOperation({
    summary: 'Get platform settings',
    description: 'Get current platform settings (public endpoint)',
  })
  @ApiResponse({
    status: 200,
    description: 'Platform settings retrieved successfully',
  })
  async getSettings() {
    return this.platformSettingsService.getSettings();
  }

  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update platform settings',
    description: 'Update platform settings (ADMIN only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Platform settings updated successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async updateSettings(
    @Body() body: UpdatePlatformSettingsDto,
    @CurrentUser() user: any,
  ) {
    return this.platformSettingsService.updateSettings(body, user.id);
  }
}
