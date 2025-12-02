import {
  Controller,
  Get,
  Post,
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
  ApiQuery,
} from '@nestjs/swagger';
import { PaymentVerificationService } from './payment-verification.service';
import { UploadReceiptDto } from './dto/upload-receipt.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';

@ApiTags('payment-verification')
@Controller('payment-verification')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentVerificationController {
  constructor(
    private readonly paymentVerificationService: PaymentVerificationService,
  ) {}

  @Post('upload-receipt')
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Upload payment receipt (student)' })
  @ApiResponse({
    status: 201,
    description: 'Receipt uploaded successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async uploadReceipt(@Body() uploadReceiptDto: UploadReceiptDto) {
    return this.paymentVerificationService.uploadReceipt(uploadReceiptDto);
  }

  @Get('pending')
  @Roles('ORGANIZER', 'EXTERNAL_PARTNER', 'MODERATOR', 'ADMIN')
  @ApiOperation({ summary: 'Get pending payment verifications (organizer/partner/moderator)' })
  @ApiQuery({ name: 'eventId', required: false })
  @ApiResponse({
    status: 200,
    description: 'Returns pending verifications',
  })
  async getPendingVerifications(
    @Request() req: RequestWithUser,
    @Query('eventId') eventId?: string,
  ) {
    return this.paymentVerificationService.getPendingVerifications(
      req.user.sub,
      eventId,
    );
  }

  @Get('event/:eventId')
  @Roles('ORGANIZER', 'EXTERNAL_PARTNER', 'MODERATOR', 'ADMIN')
  @ApiOperation({
    summary: 'Get all verifications for an event (organizer/partner/moderator)',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns all verifications for the event',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Not event organizer/partner' })
  async getEventVerifications(@Request() req: RequestWithUser, @Param('eventId') eventId: string) {
    return this.paymentVerificationService.getEventVerifications(
      eventId,
      req.user.sub,
    );
  }

  @Post(':id/verify')
  @Roles('ORGANIZER', 'EXTERNAL_PARTNER', 'MODERATOR', 'ADMIN')
  @ApiOperation({ summary: 'Approve or reject payment (organizer/partner/moderator)' })
  @ApiResponse({
    status: 200,
    description: 'Payment verification updated',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Not event organizer/partner' })
  @ApiResponse({ status: 404, description: 'Verification not found' })
  async verifyPayment(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() verifyDto: VerifyPaymentDto,
  ) {
    return this.paymentVerificationService.verifyPayment(
      id,
      req.user.sub,
      verifyDto,
    );
  }

  @Get('my-verifications')
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Get my payment verifications (student)' })
  @ApiResponse({
    status: 200,
    description: 'Returns student payment verifications',
  })
  async getMyVerifications(@Request() req: RequestWithUser) {
    return this.paymentVerificationService.getMyVerifications(req.user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment verification by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns payment verification',
  })
  @ApiResponse({ status: 404, description: 'Verification not found' })
  async findOne(@Param('id') id: string) {
    return this.paymentVerificationService.findOne(id);
  }
}
