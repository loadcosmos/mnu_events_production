import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import {
  ValidateTicketDto,
  ValidateTicketResponseDto,
} from './dto/validate-ticket.dto';
import {
  ValidateStudentDto,
  ValidateStudentResponseDto,
} from './dto/validate-student.dto';
import {
  CheckInStatsDto,
  GenerateEventQRDto,
  GenerateEventQRResponseDto,
} from './dto/checkin-stats.dto';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';
import { Role } from '@prisma/client';

@Injectable()
export class CheckinService {
  private readonly logger = new Logger(CheckinService.name);
  // SECURITY FIX: Removed in-memory rate limiting - now using Redis
  // This prevents bypass in multi-instance deployments

  constructor(
    private prisma: PrismaService,
    private gamificationService: GamificationService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) { }

  /**
   * MODE 1: Organizer scans student's ticket QR code
   * Validates ticket and creates check-in record
   */
  async validateTicket(
    dto: ValidateTicketDto,
    organizerId: string,
  ): Promise<ValidateTicketResponseDto> {
    // 1. Verify organizer/partner has access to this event
    const event = await this.prisma.event.findUnique({
      where: { id: dto.eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Allow access if user is creator OR external partner
    if (event.creatorId !== organizerId && event.externalPartnerId !== organizerId) {
      throw new ForbiddenException('You do not have access to this event');
    }

    // 2. Parse and validate QR data
    let qrPayload: any;
    try {
      qrPayload = JSON.parse(dto.qrData);
    } catch {
      throw new BadRequestException('Invalid QR code format');
    }

    // 3. Verify QR signature
    // SECURITY: PAYMENT_SECRET must be set in environment variables
    if (!process.env.PAYMENT_SECRET) {
      throw new BadRequestException('Payment secret not configured');
    }

    const { signature, ...dataToVerify } = qrPayload;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.PAYMENT_SECRET)
      .update(JSON.stringify(dataToVerify))
      .digest('hex');

    if (signature !== expectedSignature) {
      throw new BadRequestException('Invalid QR code signature');
    }

    // 4. Handle both ticket QR (paid events) and registration QR (free events)
    if (qrPayload.ticketId) {
      // PAID EVENT: Validate ticket
      const ticket = await this.prisma.ticket.findUnique({
        where: { id: qrPayload.ticketId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              faculty: true,
            },
          },
        },
      });

      if (!ticket) {
        throw new NotFoundException('Ticket not found');
      }

      // 5. Validate ticket status
      if (ticket.status === 'USED') {
        throw new ConflictException('Ticket has already been used');
      }

      if (ticket.status !== 'PAID') {
        throw new BadRequestException(
          `Ticket is ${ticket.status.toLowerCase()}. Only paid tickets can be checked in.`,
        );
      }

      // 6. Verify ticket is for correct event
      if (ticket.eventId !== dto.eventId) {
        throw new BadRequestException(
          'Ticket is for a different event',
        );
      }

      // 7. Update ticket status to USED and create check-in record
      const [updatedTicket, checkIn] = await this.prisma.$transaction([
        this.prisma.ticket.update({
          where: { id: ticket.id },
          data: {
            status: 'USED',
            checkedInAt: new Date(),
          },
        }),
        this.prisma.checkIn.create({
          data: {
            eventId: dto.eventId,
            userId: ticket.userId,
            scanMode: 'ORGANIZER_SCANS',
          },
        }),
      ]);

      // Award points for check-in and get points earned
      let pointsEarned = 0;
      try {
        pointsEarned = await this.gamificationService.onEventCheckIn(ticket.userId, dto.eventId);
      } catch (err) {
        this.logger.error('Gamification error:', err);
      }

      return {
        success: true,
        message: 'Check-in successful',
        pointsEarned,
        user: {
          id: ticket.user.id,
          firstName: ticket.user.firstName,
          lastName: ticket.user.lastName,
          email: ticket.user.email,
          faculty: ticket.user.faculty ?? undefined,
        },
        ticket: {
          id: ticket.id,
          price: Number(ticket.price),
          purchasedAt: ticket.purchasedAt,
        },
        checkIn: {
          id: checkIn.id,
          checkedInAt: checkIn.checkedInAt,
        },
      };
    } else if (qrPayload.registrationId) {
      // FREE EVENT: Validate registration
      const registration = await this.prisma.registration.findUnique({
        where: { id: qrPayload.registrationId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              faculty: true,
            },
          },
        },
      });

      if (!registration) {
        throw new NotFoundException('Registration not found');
      }

      // Validate registration status
      if (registration.checkedIn) {
        throw new ConflictException('Already checked in');
      }

      if (registration.status !== 'REGISTERED') {
        throw new BadRequestException(
          `Registration is ${registration.status.toLowerCase()}. Only registered users can be checked in.`,
        );
      }

      // Verify registration is for correct event
      if (registration.eventId !== dto.eventId) {
        throw new BadRequestException(
          'Registration is for a different event',
        );
      }

      // Update registration and create check-in record
      const [updatedRegistration, checkIn] = await this.prisma.$transaction([
        this.prisma.registration.update({
          where: { id: registration.id },
          data: {
            checkedIn: true,
            checkedInAt: new Date(),
          },
        }),
        this.prisma.checkIn.create({
          data: {
            eventId: dto.eventId,
            userId: registration.userId,
            scanMode: 'ORGANIZER_SCANS',
          },
        }),
      ]);

      // Award points for check-in and get points earned
      let pointsEarned = 0;
      try {
        pointsEarned = await this.gamificationService.onEventCheckIn(registration.userId, dto.eventId);
      } catch (err) {
        this.logger.error('Gamification error:', err);
      }

      return {
        success: true,
        message: 'Check-in successful',
        pointsEarned,
        user: {
          id: registration.user.id,
          firstName: registration.user.firstName,
          lastName: registration.user.lastName,
          email: registration.user.email,
          faculty: registration.user.faculty ?? undefined,
        },
        ticket: undefined, // No ticket for free events
        checkIn: {
          id: checkIn.id,
          checkedInAt: checkIn.checkedInAt,
        },
      };
    } else {
      throw new BadRequestException('Invalid QR code: missing ticketId or registrationId');
    }
  }

  /**
   * MODE 2: Student scans event's QR code
   * Validates event QR and creates check-in record
   */
  async validateStudent(
    dto: ValidateStudentDto,
    userId: string,
  ): Promise<ValidateStudentResponseDto> {
    // 1. Parse QR data
    let qrPayload: any;
    try {
      qrPayload = JSON.parse(dto.qrData);
    } catch {
      throw new BadRequestException('Invalid QR code format');
    }

    // 2. Verify QR signature
    // SECURITY: PAYMENT_SECRET must be set in environment variables
    if (!process.env.PAYMENT_SECRET) {
      throw new BadRequestException('Payment secret not configured');
    }

    const { signature, ...dataToVerify } = qrPayload;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.PAYMENT_SECRET)
      .update(JSON.stringify(dataToVerify))
      .digest('hex');

    if (signature !== expectedSignature) {
      throw new BadRequestException('Invalid QR code signature');
    }

    // 3. Find event
    const event = await this.prisma.event.findUnique({
      where: { id: qrPayload.eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // 4. Verify event time window (can check-in 30 minutes before start until end)
    const now = new Date();
    const eventStart = new Date(event.startDate);
    const eventEnd = new Date(event.endDate);
    const EARLY_CHECKIN_MINUTES = 30;

    const earliestCheckIn = new Date(eventStart.getTime() - EARLY_CHECKIN_MINUTES * 60 * 1000);

    if (now < earliestCheckIn) {
      const minutesUntilStart = Math.ceil((earliestCheckIn.getTime() - now.getTime()) / (60 * 1000));
      throw new BadRequestException(
        `Check-in not available yet. You can check in ${minutesUntilStart} minutes before the event starts.`
      );
    }

    if (now > eventEnd) {
      throw new BadRequestException('Check-in is no longer available. Event has ended.');
    }

    // 5. Verify QR code hasn't expired
    if (event.qrCodeExpiry && new Date() > event.qrCodeExpiry) {
      throw new BadRequestException('QR code has expired');
    }

    // 6. Check for duplicate check-in
    const existingCheckIn = await this.prisma.checkIn.findUnique({
      where: {
        eventId_userId: {
          eventId: event.id,
          userId: userId,
        },
      },
    });

    if (existingCheckIn) {
      throw new ConflictException('You have already checked in to this event');
    }

    // 7. SECURITY FIX: Redis-based rate limiting (works across multiple instances)
    // Max 1 scan per 5 seconds per user per event
    const rateLimitKey = `checkin:ratelimit:${userId}:${event.id}`;
    const RATE_LIMIT_WINDOW = 5; // 5 seconds
    
    // Check if rate limit key exists in Redis
    const lastScanTime = await this.cacheManager.get<number>(rateLimitKey);
    const now = Date.now();

    if (lastScanTime) {
      const timeElapsed = now - lastScanTime;
      if (timeElapsed < RATE_LIMIT_WINDOW * 1000) {
        const remainingSeconds = Math.ceil((RATE_LIMIT_WINDOW * 1000 - timeElapsed) / 1000);
        throw new BadRequestException(
          `Please wait ${remainingSeconds} second(s) before scanning again`
        );
      }
    }

    // Set rate limit in Redis with TTL
    await this.cacheManager.set(
      rateLimitKey,
      now,
      RATE_LIMIT_WINDOW * 1000, // TTL in milliseconds
    );

    // 8. Geolocation validation removed (not in MVP scope)
    // Location data is logged for future proximity check implementation
    if (dto.location) {
      this.logger.log('Location check:', dto.location);
    }

    // 9. Create check-in record
    const checkIn = await this.prisma.checkIn.create({
      data: {
        eventId: event.id,
        userId: userId,
        scanMode: 'STUDENTS_SCAN',
      },
    });

    // Award points for check-in and get points earned
    let pointsEarned = 0;
    try {
      pointsEarned = await this.gamificationService.onEventCheckIn(userId, event.id);
    } catch (err) {
      this.logger.error('Gamification error:', err);
    }

    // SECURITY FIX: No manual cleanup needed - Redis TTL handles expiration

    return {
      success: true,
      message: 'Check-in successful',
      pointsEarned,
      checkIn: {
        id: checkIn.id,
        eventId: checkIn.eventId,
        checkedInAt: checkIn.checkedInAt,
      },
    };
  }

  /**
   * Get check-in statistics for an event
   */
  async getEventStats(
    eventId: string,
    userId: string,
    role: Role,
  ): Promise<CheckInStatsDto> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Allow access if user is admin, creator, OR external partner
    if (role !== Role.ADMIN && event.creatorId !== userId && event.externalPartnerId !== userId) {
      throw new ForbiddenException('You do not have access to this event');
    }

    const totalCheckIns = await this.prisma.checkIn.count({
      where: { eventId },
    });

    let totalTickets: number | undefined;
    let totalRegistrations: number | undefined;
    let checkInRate: number;

    if (event.isPaid) {
      // For paid events, count tickets
      totalTickets = await this.prisma.ticket.count({
        where: {
          eventId,
          status: { in: ['PAID', 'USED'] },
        },
      });
      checkInRate = totalTickets > 0 ? (totalCheckIns / totalTickets) * 100 : 0;
    } else {
      // For free events, count registrations
      totalRegistrations = await this.prisma.registration.count({
        where: {
          eventId,
          status: 'REGISTERED',
        },
      });
      checkInRate =
        totalRegistrations > 0 ? (totalCheckIns / totalRegistrations) * 100 : 0;
    }

    return {
      totalCheckIns,
      totalTickets,
      totalRegistrations,
      checkInRate: Math.round(checkInRate * 10) / 10,
      capacity: event.capacity,
      checkInMode: event.checkInMode,
    };
  }

  /**
   * Get list of all check-ins for an event
   */
  async getCheckInList(eventId: string, organizerId: string) {
    // Verify organizer/partner has access to this event
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Allow access if user is creator OR external partner
    if (event.creatorId !== organizerId && event.externalPartnerId !== organizerId) {
      throw new ForbiddenException('You do not have access to this event');
    }

    const checkIns = await this.prisma.checkIn.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            faculty: true,
          },
        },
      },
      orderBy: { checkedInAt: 'desc' },
    });

    return checkIns;
  }

  /**
   * Generate QR code for event (MODE 2: students scan)
   */
  async generateEventQR(
    dto: GenerateEventQRDto,
    organizerId: string,
  ): Promise<GenerateEventQRResponseDto> {
    // Verify organizer/partner has access to this event
    const event = await this.prisma.event.findUnique({
      where: { id: dto.eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Allow access if user is creator OR external partner
    if (event.creatorId !== organizerId && event.externalPartnerId !== organizerId) {
      throw new ForbiddenException('You do not have access to this event');
    }

    // Generate QR payload
    const expiryHours = dto.expiryHours || 24;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiryHours);

    const qrPayload = {
      eventId: event.id,
      timestamp: Date.now(),
    };

    // Sign the payload
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

    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    // Update event with new QR code
    await this.prisma.event.update({
      where: { id: event.id },
      data: {
        eventQRCode: qrCodeDataUrl,
        qrCodeExpiry: expiresAt,
      },
    });

    return {
      qrCode: qrCodeDataUrl,
      expiresAt,
    };
  }
}
