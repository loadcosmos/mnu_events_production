import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdatePricingDto } from './dto/update-pricing.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('pricing')
  @ApiOperation({ summary: 'Get current event pricing' })
  @ApiResponse({
    status: 200,
    description: 'Returns current pricing tiers',
  })
  async getPricing() {
    return this.settingsService.getPricing();
  }

  @Put('pricing')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update event pricing (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Pricing updated successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  async updatePricing(@Body() updatePricingDto: UpdatePricingDto) {
    return this.settingsService.updatePricing(updatePricingDto);
  }

  @Get('pricing/history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get pricing history (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Returns pricing history',
  })
  async getPricingHistory() {
    return this.settingsService.getPricingHistory();
  }
}
