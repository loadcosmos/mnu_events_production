import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('pricing')
  @Public()
  @ApiOperation({ summary: 'Get subscription pricing' })
  @ApiResponse({ status: 200, description: 'Returns subscription pricing' })
  async getPricing() {
    return this.subscriptionsService.getPricing();
  }

  @Post('subscribe')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STUDENT')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Subscribe to premium (student only)' })
  @ApiResponse({ status: 201, description: 'Subscription created successfully' })
  @ApiResponse({ status: 400, description: 'Already have active subscription' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async subscribe(@Request() req: RequestWithUser, @Body() createDto: CreateSubscriptionDto) {
    return this.subscriptionsService.subscribe(req.user.sub, createDto);
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my subscription status' })
  @ApiResponse({ status: 200, description: 'Returns subscription status' })
  async getStatus(@Request() req: RequestWithUser) {
    return this.subscriptionsService.getStatus(req.user.sub);
  }

  @Get('my-subscriptions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STUDENT')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my subscription history (student)' })
  @ApiResponse({ status: 200, description: 'Returns subscription history' })
  async getMySubscriptions(@Request() req: RequestWithUser) {
    return this.subscriptionsService.getMySubscriptions(req.user.sub);
  }

  @Get('check-limit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STUDENT')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if can create more services (student)' })
  @ApiResponse({ status: 200, description: 'Returns service creation limit status' })
  async checkServiceLimit(@Request() req: RequestWithUser) {
    return this.subscriptionsService.canCreateService(req.user.sub);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel subscription (admin only)' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async cancelSubscription(@Param('id') id: string) {
    return this.subscriptionsService.cancelSubscription(id);
  }
}
