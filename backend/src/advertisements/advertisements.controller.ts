import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AdvertisementsService } from './advertisements.service';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { AdPosition } from '@prisma/client';

@ApiTags('advertisements')
@Controller('advertisements')
export class AdvertisementsController {
  constructor(private readonly adsService: AdvertisementsService) { }

  @Get('pricing')
  @Public()
  @ApiOperation({ summary: 'Get advertisement pricing' })
  @ApiResponse({ status: 200, description: 'Returns pricing for all ad positions' })
  async getPricing() {
    return this.adsService.getPricing();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new advertisement (goes to moderation)' })
  @ApiResponse({ status: 201, description: 'Advertisement created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() createAdDto: CreateAdDto) {
    return this.adsService.create(createAdDto);
  }

  @Get('active')
  @Public()
  @ApiOperation({ summary: 'Get active advertisements' })
  @ApiQuery({ name: 'position', enum: AdPosition, required: false })
  @ApiResponse({ status: 200, description: 'Returns active ads' })
  async getActiveAds(@Query('position') position?: AdPosition) {
    return this.adsService.getActiveAds(position);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all advertisements (admin/moderator)' })
  @ApiResponse({ status: 200, description: 'Returns all ads' })
  async findAll() {
    return this.adsService.findAll();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get advertisement by ID' })
  @ApiResponse({ status: 200, description: 'Returns advertisement' })
  @ApiResponse({ status: 404, description: 'Advertisement not found' })
  async findOne(@Param('id') id: string) {
    return this.adsService.findOne(id);
  }

  @Patch(':id/payment-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update advertisement payment status (admin only)' })
  @ApiResponse({ status: 200, description: 'Payment status updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async updatePaymentStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdatePaymentStatusDto,
  ) {
    return this.adsService.updatePaymentStatus(id, updateStatusDto);
  }

  @Post(':id/impression')
  @Public()
  @ApiOperation({ summary: 'Track advertisement impression' })
  @ApiResponse({ status: 200, description: 'Impression tracked' })
  async trackImpression(@Param('id') id: string) {
    await this.adsService.trackImpression(id);
    return { success: true };
  }

  @Post(':id/click')
  @Public()
  @ApiOperation({ summary: 'Track advertisement click' })
  @ApiResponse({ status: 200, description: 'Click tracked' })
  async trackClick(@Param('id') id: string) {
    await this.adsService.trackClick(id);
    return { success: true };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete advertisement (admin only)' })
  @ApiResponse({ status: 200, description: 'Advertisement deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async remove(@Param('id') id: string) {
    return this.adsService.remove(id);
  }
}
