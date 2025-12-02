import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { FilterServicesDto } from './dto/filter-services.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all services with filters (public)' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of services',
  })
  async findAll(@Query() filters: FilterServicesDto) {
    return this.servicesService.findAll(filters);
  }

  @Get('my-services')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user services' })
  @ApiResponse({
    status: 200,
    description: 'List of user services',
  })
  async getMyServices(@Request() req: RequestWithUser) {
    return this.servicesService.getMyServices(req.user.sub);
  }

  @Get('provider/:id')
  @Public()
  @ApiOperation({ summary: 'Get services by provider ID (public)' })
  @ApiResponse({
    status: 200,
    description: 'List of provider services',
  })
  async getByProvider(@Param('id') id: string) {
    return this.servicesService.getByProvider(id);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get service by ID (public)' })
  @ApiResponse({ status: 200, description: 'Service details' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new service (requires moderation for students)' })
  @ApiResponse({
    status: 201,
    description: 'Service created successfully',
  })
  async create(@Body() dto: CreateServiceDto, @Request() req: RequestWithUser) {
    return this.servicesService.create(dto, req.user.sub, req.user.role);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update service' })
  @ApiResponse({ status: 200, description: 'Service updated successfully' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
    @Request() req: RequestWithUser,
  ) {
    return this.servicesService.update(id, dto, req.user.sub, req.user.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete service' })
  @ApiResponse({ status: 200, description: 'Service deleted successfully' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async remove(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.servicesService.remove(id, req.user.sub, req.user.role);
  }
}
