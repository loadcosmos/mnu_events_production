import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentWebhookDto } from './dto/payment-webhook.dto';
import { RefundTicketDto } from './dto/refund-ticket.dto';
import {
  PaymentResponse,
  TicketResponse,
  TransactionStatus,
} from './interfaces/payment-response.interface';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private platformSettingsService: PlatformSettingsService,
  ) { }

  /**
   * Create a mock payment and return redirect URL
   */
  async createPayment(
    dto: CreatePaymentDto,
    userId: string,
  ): Promise<PaymentResponse> {
    // 1. Verify event exists and is paid
    const event = await this.prisma.event.findUnique({
      where: { id: dto.eventId },
      include: {
        externalPartner: true, // Include partner info for commission calculation
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (!event.isPaid) {
      throw new BadRequestException('This event is free');
    }

    // 2. Check if user already has a ticket for this event
    const existingTicket = await this.prisma.ticket.findFirst({
      where: {
        eventId: dto.eventId,
        userId: userId,
        status: { in: ['PENDING', 'PAID'] },
      },
    });

    if (existingTicket) {
      throw new ConflictException('You already have a ticket for this event');
    }

    // 3. Check event capacity
    const ticketCount = await this.prisma.ticket.count({
      where: {
        eventId: dto.eventId,
        status: { in: ['PENDING', 'PAID'] },
      },
    });

    if (ticketCount >= event.capacity) {
      throw new BadRequestException('Event is sold out');
    }

    // 4. Verify payment amount matches event price
    if (!event.price) {
      throw new BadRequestException('Event price not configured');
    }

    // 5. Calculate commission for external partner events
    let commissionRate: Decimal | null = null;
    let commissionAmount: Decimal | null = null;
    let partnerAmount: Decimal | null = null;
    let ticketCode: string | null = null;

    if (event.isExternalEvent && event.externalPartner) {
      // Get platform settings for commission rate
      const settings = await this.platformSettingsService.getSettings();

      // Use partner-specific commission rate if set, otherwise default
      commissionRate = event.externalPartner.commissionRate;

      // Calculate commission
      const price = Number(event.price);
      commissionAmount = new Decimal(price * Number(commissionRate));
      partnerAmount = new Decimal(price - Number(commissionAmount));

      // Generate unique ticket code for Kaspi comment
      ticketCode = `TICKET-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

      this.logger.log(`Commission calculated for partner event: rate=${commissionRate}, amount=${commissionAmount}`);
    }

    // Verify payment amount
    const platformFee = event.platformFee || new Decimal(0);
    const expectedTotal = Number(event.price) + Number(platformFee);

    if (dto.amount !== expectedTotal) {
      throw new BadRequestException(
        `Invalid payment amount. Expected ${expectedTotal}`,
      );
    }

    // 6. Generate unique transaction ID
    const transactionId = `txn_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

    // 7. Create pending ticket
    await this.prisma.ticket.create({
      data: {
        eventId: dto.eventId,
        userId: userId,
        price: event.price,
        platformFee: platformFee,
        commissionRate: commissionRate,
        commissionAmount: commissionAmount,
        partnerAmount: partnerAmount,
        ticketCode: ticketCode,
        status: 'PENDING',
        paymentMethod: event.isExternalEvent ? 'kaspi' : 'mock',
        transactionId: transactionId,
      },
    });

    // 8. Return mock payment redirect URL
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/mock-payment/${transactionId}`;

    return {
      success: true,
      transactionId,
      redirectUrl,
      message: 'Redirecting to mock payment gateway',
    };
  }

  /**
   * Confirm mock payment (Dev/Test only)
   */
  async confirmMockPayment(transactionId: string): Promise<TicketResponse> {
    // 1. Find pending ticket
    const ticket = await this.prisma.ticket.findUnique({
      where: { transactionId },
      include: {
        event: true,
        user: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException('Transaction not found');
    }

    if (ticket.status !== 'PENDING') {
      throw new BadRequestException(`Transaction already processed (Status: ${ticket.status})`);
    }

    // 2. Generate QR code
    const qrCodeData = await this.generateQRCode(ticket.id, ticket.eventId, ticket.userId);

    // 3. Update ticket to PAID
    const updatedTicket = await this.prisma.$transaction(async (tx) => {
      return tx.ticket.update({
        where: { id: ticket.id },
        data: {
          status: 'PAID',
          qrCode: qrCodeData,
          purchasedAt: new Date(),
        },
        include: {
          event: true,
        },
      });
    });

    return this.formatTicketResponse(updatedTicket);
  }

  /**
   * Process webhook from mock payment gateway
   */
  async processWebhook(dto: PaymentWebhookDto): Promise<TicketResponse> {
    // 1. Find pending ticket by transaction ID (read-only, outside transaction)
    const ticket = await this.prisma.ticket.findUnique({
      where: { transactionId: dto.transactionId },
      include: {
        event: true,
        user: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException('Transaction not found');
    }

    if (ticket.status !== 'PENDING') {
      throw new BadRequestException('Transaction already processed');
    }

    // 2. Process based on webhook status
    if (dto.status === 'success') {
      // Generate QR code before transaction (no DB writes)
      const qrCodeData = await this.generateQRCode(ticket.id, ticket.eventId, ticket.userId);

      // Atomic transaction for all database updates
      const updatedTicket = await this.prisma.$transaction(async (tx) => {
        // Update ticket status and QR code atomically
        const updated = await tx.ticket.update({
          where: { id: ticket.id },
          data: {
            status: 'PAID',
            qrCode: qrCodeData,
          },
          include: {
            event: {
              select: {
                id: true,
                title: true,
                startDate: true,
                endDate: true,
                location: true,
              },
            },
          },
        });

        // If any error occurs, entire transaction rolls back
        return updated;
      });

      // Email sending moved to background job queue (Phase 2)
      // This prevents blocking the webhook response
      // await this.sendTicketEmail(ticket.user.email, updatedTicket);

      return this.formatTicketResponse(updatedTicket);
    } else {
      // Payment failed - delete ticket in transaction
      await this.prisma.$transaction(async (tx) => {
        await tx.ticket.delete({
          where: { id: ticket.id },
        });
      });

      throw new BadRequestException(
        dto.status === 'declined'
          ? 'Payment was declined'
          : 'Payment failed',
      );
    }
  }

  /**
   * Get ticket by ID (with authorization check)
   */
  async getTicketById(
    ticketId: string,
    userId: string,
    userRole: string,
  ): Promise<TicketResponse> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            location: true,
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Authorization: Only ticket owner or admin can view
    if (ticket.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('You do not have access to this ticket');
    }

    return this.formatTicketResponse(ticket);
  }

  /**
   * Get all tickets for current user
   */
  async getMyTickets(userId: string): Promise<TicketResponse[]> {
    const tickets = await this.prisma.ticket.findMany({
      where: {
        userId: userId,
        status: { in: ['PAID', 'USED'] }, // Exclude PENDING, REFUNDED, EXPIRED
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            location: true,
          },
        },
      },
      orderBy: { purchasedAt: 'desc' },
    });

    return tickets.map((ticket) => this.formatTicketResponse(ticket));
  }

  /**
   * Refund a ticket
   */
  async refundTicket(
    ticketId: string,
    userId: string,
    userRole: string,
    dto?: RefundTicketDto,
  ): Promise<{ message: string }> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { event: true },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Authorization: Only ticket owner or admin can refund
    if (ticket.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('You do not have access to this ticket');
    }

    // Validate ticket status
    if (ticket.status === 'REFUNDED') {
      throw new BadRequestException('Ticket has already been refunded');
    }

    if (ticket.status === 'USED') {
      throw new BadRequestException('Ticket has already been used');
    }

    if (ticket.status !== 'PAID') {
      throw new BadRequestException('Only paid tickets can be refunded');
    }

    // Check if event has already started (cannot refund after event start)
    if (new Date() >= ticket.event.startDate) {
      throw new BadRequestException(
        'Cannot refund ticket after event has started',
      );
    }

    // Update ticket status to REFUNDED
    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: 'REFUNDED',
      },
    });

    // Refund processing: Mock payment system
    // Actual payment gateway integration will be added in Phase 2
    // Refund confirmation emails will be implemented with email queue

    return {
      message: `Ticket refunded successfully${dto?.reason ? ': ' + dto.reason : ''}`,
    };
  }

  /**
   * Get transaction status
   * SECURITY FIX: Added authorization - only ticket owner or admin can view
   */
  async getTransactionStatus(
    transactionId: string,
    userId: string,
    userRole: string,
  ): Promise<TransactionStatus> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { transactionId },
    });

    if (!ticket || !ticket.transactionId) {
      throw new NotFoundException('Transaction not found');
    }

    // SECURITY FIX: Authorization check - prevent IDOR
    // Only the ticket owner or admin can view transaction status
    if (ticket.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('You do not have access to this transaction');
    }

    return {
      transactionId: ticket.transactionId,
      status: this.mapTicketStatusToTransactionStatus(ticket.status),
      amount: Number(ticket.price) + Number(ticket.platformFee),
      createdAt: ticket.purchasedAt,
      updatedAt: ticket.purchasedAt, // Tickets don't have updatedAt, using purchasedAt
    };
  }

  /**
   * Generate QR code for ticket
   * Format: JSON with signature for security
   */
  private async generateQRCode(
    ticketId: string,
    eventId: string,
    userId: string,
  ): Promise<string> {
    const qrPayload = {
      ticketId,
      eventId,
      userId,
      timestamp: Date.now(),
    };

    // Sign the payload for security validation
    // SECURITY: PAYMENT_SECRET must be set in environment variables
    if (!process.env.PAYMENT_SECRET) {
      throw new BadRequestException('Payment secret not configured');
    }

    const signature = crypto
      .createHmac('sha256', process.env.PAYMENT_SECRET)
      .update(JSON.stringify(qrPayload))
      .digest('hex');

    const qrData = {
      ...qrPayload,
      signature,
    };

    // Generate QR code as base64 data URL
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      return qrCodeDataUrl;
    } catch (error) {
      this.logger.error('Error generating QR code:', error);
      throw new BadRequestException('Failed to generate QR code');
    }
  }

  /**
   * Format ticket for response
   */
  private formatTicketResponse(ticket: any): TicketResponse {
    return {
      id: ticket.id,
      eventId: ticket.eventId,
      userId: ticket.userId,
      price: Number(ticket.price),
      platformFee: Number(ticket.platformFee),
      status: ticket.status,
      paymentMethod: ticket.paymentMethod,
      transactionId: ticket.transactionId,
      qrCode: ticket.qrCode,
      createdAt: ticket.purchasedAt,
      updatedAt: ticket.purchasedAt,
      event: ticket.event,
    };
  }

  /**
   * Map TicketStatus to TransactionStatus
   */
  private mapTicketStatusToTransactionStatus(
    status: string,
  ): 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' {
    switch (status) {
      case 'PENDING':
        return 'PENDING';
      case 'PAID':
      case 'USED':
        return 'COMPLETED';
      case 'REFUNDED':
        return 'REFUNDED';
      case 'EXPIRED':
        return 'FAILED';
      default:
        return 'FAILED';
    }
  }
}
