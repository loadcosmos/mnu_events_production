import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadReceiptDto } from './dto/upload-receipt.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';

@Injectable()
export class PaymentVerificationService {
  private readonly logger = new Logger(PaymentVerificationService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Upload receipt for payment verification
   * Student uploads screenshot of Kaspi transfer
   */
  async uploadReceipt(uploadReceiptDto: UploadReceiptDto) {
    const { ticketId, receiptImageUrl } = uploadReceiptDto;

    // Check if ticket exists
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { event: true, user: true },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Check if ticket is pending payment
    if (ticket.status !== 'PENDING') {
      throw new BadRequestException('Ticket is not pending payment');
    }

    // Check if verification already exists
    const existingVerification = await this.prisma.paymentVerification.findUnique({
      where: { ticketId },
    });

    if (existingVerification) {
      // Update existing verification
      return this.prisma.paymentVerification.update({
        where: { ticketId },
        data: {
          receiptImageUrl,
          status: 'PENDING',
          organizerNotes: null,
          verifiedAt: null,
        },
      });
    }

    // Create new verification
    return this.prisma.paymentVerification.create({
      data: {
        ticketId,
        receiptImageUrl,
        status: 'PENDING',
      },
    });
  }

  /**
   * Get pending verifications for organizer's/partner's events
   */
  async getPendingVerifications(userId: string, eventId?: string) {
    const where: any = {
      status: 'PENDING',
      ticket: {
        event: {
          OR: [
            { creatorId: userId }, // Organizer's events
            {
              externalPartner: {
                userId: userId, // Partner's events
              },
            },
          ],
        },
      },
    };

    if (eventId) {
      where.ticket.eventId = eventId;
    }

    return this.prisma.paymentVerification.findMany({
      where,
      include: {
        ticket: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            event: {
              select: {
                id: true,
                title: true,
                price: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Get all verifications for a specific event (organizer/partner only)
   */
  async getEventVerifications(eventId: string, userId: string) {
    // Verify user owns the event (organizer or partner)
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        externalPartner: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check if user is organizer or partner
    const isOrganizer = event.creatorId === userId;
    const isPartner = event.externalPartner?.userId === userId;

    if (!isOrganizer && !isPartner) {
      throw new ForbiddenException('You are not the organizer/partner of this event');
    }

    return this.prisma.paymentVerification.findMany({
      where: {
        ticket: {
          eventId,
        },
      },
      include: {
        ticket: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Approve or reject payment verification
   * Organizer/Partner verifies the receipt and approves/rejects payment
   */
  async verifyPayment(
    verificationId: string,
    userId: string,
    verifyDto: VerifyPaymentDto,
  ) {
    const verification = await this.prisma.paymentVerification.findUnique({
      where: { id: verificationId },
      include: {
        ticket: {
          include: {
            event: {
              include: {
                externalPartner: {
                  select: {
                    userId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!verification) {
      throw new NotFoundException('Payment verification not found');
    }

    // Verify user owns the event (organizer or partner)
    const isOrganizer = verification.ticket.event.creatorId === userId;
    const isPartner = verification.ticket.event.externalPartner?.userId === userId;

    if (!isOrganizer && !isPartner) {
      throw new ForbiddenException(
        'You are not the organizer/partner of this event',
      );
    }

    // Validate rejection has notes
    if (verifyDto.status === 'REJECTED' && !verifyDto.organizerNotes) {
      throw new BadRequestException(
        'Organizer notes are required when rejecting payment',
      );
    }

    // Update verification status
    const updated = await this.prisma.paymentVerification.update({
      where: { id: verificationId },
      data: {
        status: verifyDto.status,
        organizerNotes: verifyDto.organizerNotes,
        verifiedAt: new Date(),
      },
    });

    // If approved, update ticket status to PAID and generate QR code
    if (verifyDto.status === 'APPROVED') {
      // Generate QR code for the ticket
      const qrCodeData = await this.generateQRCode(
        verification.ticketId,
        verification.ticket.eventId,
        verification.ticket.userId,
      );

      await this.prisma.ticket.update({
        where: { id: verification.ticketId },
        data: {
          status: 'PAID',
          qrCode: qrCodeData,
        },
      });

      this.logger.log(`Payment verified and QR code generated for ticket ${verification.ticketId}`);
    }

    // If rejected, student can re-upload receipt
    // Ticket stays as PENDING

    return updated;
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
   * Get verification by ID
   */
  async findOne(id: string) {
    const verification = await this.prisma.paymentVerification.findUnique({
      where: { id },
      include: {
        ticket: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            event: {
              select: {
                id: true,
                title: true,
                price: true,
                creator: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!verification) {
      throw new NotFoundException('Payment verification not found');
    }

    return verification;
  }

  /**
   * Get student's payment verifications
   */
  async getMyVerifications(userId: string) {
    return this.prisma.paymentVerification.findMany({
      where: {
        ticket: {
          userId,
        },
      },
      include: {
        ticket: {
          include: {
            event: {
              select: {
                id: true,
                title: true,
                price: true,
                startDate: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
