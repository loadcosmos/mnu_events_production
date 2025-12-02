import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ClubsService } from './clubs.service';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { FilterClubsDto } from './dto/filter-clubs.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Role } from '@prisma/client';

@ApiTags('Clubs')
@Controller('clubs')
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORGANIZER, Role.ADMIN)
  @ApiOperation({ summary: 'Create new club (Organizer/Admin only)' })
  @ApiResponse({ status: 201, description: 'Club created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() createClubDto: CreateClubDto, @CurrentUser() user: any) {
    return this.clubsService.create(createClubDto, user.id);
  }

  @Get()
  @Public()
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false, transform: true }))
  @ApiOperation({ summary: 'Get all clubs with filters and pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'category', required: false, enum: ['ACADEMIC', 'ARTS', 'SERVICE', 'TECH', 'SPORTS', 'CULTURAL', 'OTHER'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Clubs retrieved' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    const filters: FilterClubsDto = {};
    if (category) filters.category = category as any;
    if (search) filters.search = search;
    
    return this.clubsService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      Object.keys(filters).length > 0 ? filters : undefined,
    );
  }

  @Get('my')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get my clubs (organized or member)' })
  @ApiResponse({ status: 200, description: 'My clubs retrieved' })
  getMyClubs(@CurrentUser() user: any) {
    return this.clubsService.getMyClubs(user.id);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get club by ID' })
  @ApiResponse({ status: 200, description: 'Club found' })
  @ApiResponse({ status: 404, description: 'Club not found' })
  findOne(@Param('id') id: string) {
    return this.clubsService.findOne(id);
  }

  @Post(':id/join')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Join a club' })
  @ApiResponse({ status: 201, description: 'Joined club successfully' })
  @ApiResponse({ status: 400, description: 'Already a member' })
  @ApiResponse({ status: 404, description: 'Club not found' })
  joinClub(@Param('id') id: string, @CurrentUser() user: any) {
    return this.clubsService.joinClub(id, user.id);
  }

  @Post(':id/leave')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Leave a club' })
  @ApiResponse({ status: 200, description: 'Left club successfully' })
  @ApiResponse({ status: 400, description: 'Cannot leave as organizer' })
  @ApiResponse({ status: 404, description: 'Not a member' })
  leaveClub(@Param('id') id: string, @CurrentUser() user: any) {
    return this.clubsService.leaveClub(id, user.id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORGANIZER, Role.ADMIN)
  @ApiOperation({ summary: 'Update club (Organizer or Admin only)' })
  @ApiResponse({ status: 200, description: 'Club updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Club not found' })
  update(
    @Param('id') id: string,
    @Body() updateClubDto: UpdateClubDto,
    @CurrentUser() user: any,
  ) {
    return this.clubsService.update(id, updateClubDto, user.id);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORGANIZER, Role.ADMIN)
  @ApiOperation({ summary: 'Delete club (Organizer or Admin only)' })
  @ApiResponse({ status: 200, description: 'Club deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Club not found' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.clubsService.remove(id, user.id);
  }
}


