import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Request,
  Headers,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentWebhookDto } from './dto/payment-webhook.dto';
import { RefundTicketDto } from './dto/refund-ticket.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) { }

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a payment for event ticket (mock)' })
  @ApiResponse({
    status: 201,
    description: 'Payment created, returns redirect URL to mock gateway',
  })
  @ApiResponse({ status: 400, description: 'Bad request (invalid amount, sold out, etc.)' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiResponse({ status: 409, description: 'User already has a ticket for this event' })
  async createPayment(
    @Body() dto: CreatePaymentDto,
    @Request() req: RequestWithUser,
  ) {
    return this.paymentsService.createPayment(dto, req.user.sub);
  }

  @Post('mock-confirm/:transactionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm a mock payment (dev only)' })
  @ApiResponse({ status: 200, description: 'Payment confirmed' })
  async confirmMockPayment(
    @Param('transactionId') transactionId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.paymentsService.confirmMockPayment(transactionId);
  }

  @Post('webhook')
  @Public()
  @ApiOperation({ summary: 'Webhook for payment confirmation (mock gateway)' })
  @ApiResponse({
    status: 200,
    description: 'Payment processed successfully, ticket created',
  })
  @ApiResponse({ status: 400, description: 'Payment failed or declined' })
  @ApiResponse({ status: 401, description: 'Invalid signature' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async processWebhook(
    @Body() dto: PaymentWebhookDto,
    @Headers('x-payment-signature') signature: string,
  ) {
    if (!signature) {
      throw new UnauthorizedException('Missing signature');
    }

    const secret = process.env.PAYMENT_SECRET;
    if (!secret) {
      throw new InternalServerErrorException('Payment secret not configured');
    }

    const calculatedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(dto))
      .digest('hex');

    if (signature !== calculatedSignature) {
      throw new UnauthorizedException('Invalid signature');
    }

    return this.paymentsService.processWebhook(dto);
  }

  @Get('ticket/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get ticket by ID' })
  @ApiResponse({ status: 200, description: 'Ticket details with QR code' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async getTicketById(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.paymentsService.getTicketById(id, req.user.sub, req.user.role);
  }

  @Get('my-tickets')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all tickets for current user' })
  @ApiResponse({
    status: 200,
    description: 'List of user tickets (PAID and USED)',
  })
  async getMyTickets(@Request() req: RequestWithUser) {
    return this.paymentsService.getMyTickets(req.user.sub);
  }

  @Post('refund/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refund a ticket' })
  @ApiResponse({ status: 200, description: 'Ticket refunded successfully' })
  @ApiResponse({
    status: 400,
    description: 'Cannot refund (already used, event started, etc.)',
  })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async refundTicket(
    @Param('id') id: string,
    @Body() dto: RefundTicketDto,
    @Request() req: RequestWithUser,
  ) {
    return this.paymentsService.refundTicket(
      id,
      req.user.sub,
      req.user.role,
      dto,
    );
  }

  @Get('transaction/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get transaction status by ID' })
  @ApiResponse({ status: 200, description: 'Transaction status' })
  @ApiResponse({ status: 403, description: 'Access denied - not your transaction' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async getTransactionStatus(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ) {
    // SECURITY FIX: Pass user info for authorization check
    return this.paymentsService.getTransactionStatus(id, req.user.sub, req.user.role);
  }
}
