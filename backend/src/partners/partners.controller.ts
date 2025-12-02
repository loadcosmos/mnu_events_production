import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { PartnersService } from './partners.service';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Partners')
@Controller('partners')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) { }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Create external partner',
    description: 'Create new external partner (ADMIN only)',
  })
  @ApiResponse({ status: 201, description: 'Partner created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Partner already exists' })
  create(@Body() createPartnerDto: CreatePartnerDto) {
    return this.partnersService.create(createPartnerDto);
  }

  @Get()
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Get all partners',
    description: 'Get all external partners with optional filters (ADMIN only)',
  })
  @ApiQuery({ name: 'isVerified', required: false, type: Boolean })
  @ApiQuery({ name: 'hasPremium', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Partners retrieved successfully' })
  findAll(
    @Query('isVerified') isVerified?: string,
    @Query('hasPremium') hasPremium?: string,
  ) {
    const filters: any = {};
    if (isVerified !== undefined) filters.isVerified = isVerified === 'true';
    if (hasPremium !== undefined) filters.hasPremium = hasPremium === 'true';
    return this.partnersService.findAll(filters);
  }

  @Get('me')
  @Roles('EXTERNAL_PARTNER')
  @ApiOperation({
    summary: 'Get my partner profile',
    description: 'Get current partner profile (EXTERNAL_PARTNER only)',
  })
  @ApiResponse({ status: 200, description: 'Partner profile retrieved' })
  @ApiResponse({ status: 404, description: 'Partner not found' })
  getMyProfile(@CurrentUser() user: any) {
    return this.partnersService.findByUserId(user.id);
  }

  @Get('me/stats')
  @Roles('EXTERNAL_PARTNER')
  @ApiOperation({
    summary: 'Get my statistics',
    description: 'Get partner statistics (EXTERNAL_PARTNER only)',
  })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  getMyStats(@CurrentUser() user: any) {
    return this.partnersService.getStats(user.id);
  }

  @Get('me/can-create-event')
  @Roles('EXTERNAL_PARTNER')
  @ApiOperation({
    summary: 'Check if can create event',
    description: 'Check if partner can create new event based on limits',
  })
  @ApiResponse({ status: 200, description: 'Limit check result' })
  canCreateEvent(@CurrentUser() user: any) {
    return this.partnersService.canCreateEvent(user.id);
  }

  @Get(':id')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Get partner by ID',
    description: 'Get partner details by ID (ADMIN only)',
  })
  @ApiResponse({ status: 200, description: 'Partner retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Partner not found' })
  findOne(@Param('id') id: string) {
    return this.partnersService.findOne(id);
  }

  @Patch('me')
  @Roles('EXTERNAL_PARTNER')
  @ApiOperation({
    summary: 'Update my profile',
    description: 'Update own partner profile (EXTERNAL_PARTNER only)',
  })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  updateMyProfile(
    @CurrentUser() user: any,
    @Body() updatePartnerDto: UpdatePartnerDto,
  ) {
    // Get partner by userId first
    return this.partnersService
      .findByUserId(user.id)
      .then((partner) =>
        this.partnersService.update(partner.id, updatePartnerDto, user.id),
      );
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Update partner',
    description: 'Update partner by ID (ADMIN only)',
  })
  @ApiResponse({ status: 200, description: 'Partner updated successfully' })
  @ApiResponse({ status: 404, description: 'Partner not found' })
  update(@Param('id') id: string, @Body() updatePartnerDto: UpdatePartnerDto) {
    return this.partnersService.update(id, updatePartnerDto);
  }

  @Patch(':id/commission-rate')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update commission rate',
    description: 'Update partner commission rate (ADMIN only)',
  })
  @ApiResponse({ status: 200, description: 'Commission rate updated' })
  updateCommissionRate(
    @Param('id') id: string,
    @Body('rate') rate: number,
  ) {
    return this.partnersService.updateCommissionRate(id, rate);
  }

  @Post(':id/paid-slots')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Add paid event slots',
    description: 'Add paid event slots to partner (ADMIN only)',
  })
  @ApiResponse({ status: 200, description: 'Slots added successfully' })
  addPaidSlots(@Param('id') id: string, @Body('slots') slots: number) {
    return this.partnersService.addPaidSlots(id, slots);
  }

  @Post(':id/commission-paid')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark commission as paid',
    description: 'Mark commission payment received (ADMIN only)',
  })
  @ApiResponse({ status: 200, description: 'Commission marked as paid' })
  markCommissionPaid(@Param('id') id: string, @Body('amount') amount: number) {
    return this.partnersService.markCommissionPaid(id, amount);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete partner',
    description: 'Delete partner (ADMIN only, no active events)',
  })
  @ApiResponse({ status: 200, description: 'Partner deleted successfully' })
  @ApiResponse({ status: 400, description: 'Partner has active events' })
  @ApiResponse({ status: 404, description: 'Partner not found' })
  remove(@Param('id') id: string) {
    return this.partnersService.remove(id);
  }
}
