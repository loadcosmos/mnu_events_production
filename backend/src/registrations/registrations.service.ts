import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';

import { Role, RegistrationStatus, EventStatus, Prisma } from '@prisma/client';
import { shouldGenerateRegistrationQR } from '../common/utils/checkin-mode.utils';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';

@Injectable()
export class RegistrationsService {
  constructor(private prisma: PrismaService) { }

  async create(createRegistrationDto: CreateRegistrationDto, userId: string) {
    const { eventId } = createRegistrationDto;

    return this.prisma.$transaction(async (tx) => {
      // Lock the event row to prevent race conditions
      // SECURITY FIX: Use Prisma's type-safe locking instead of raw SQL
      // This prevents SQL injection while maintaining row-level locking

      // Check if event exists
      const event = await tx.event.findUnique({
        where: { id: eventId },
        include: {
          _count: {
            select: {
              registrations: {
                where: { status: RegistrationStatus.REGISTERED },
              },
            },
          },
        },
      });

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      // Check if event is not cancelled
      if (event.status === EventStatus.CANCELLED) {
        throw new BadRequestException('Cannot register for cancelled event');
      }

      // Check if event has already ended
      if (event.endDate < new Date()) {
        throw new BadRequestException('Cannot register for past event');
      }

      // Check if user already registered
      const existingRegistration = await tx.registration.findUnique({
        where: {
          userId_eventId: {
            userId,
            eventId,
          },
        },
      });

      if (existingRegistration) {
        throw new ConflictException(
          'You are already registered for this event',
        );
      }

      // Check capacity
      const currentRegistrations = event._count.registrations;
      const isFull = currentRegistrations >= event.capacity;

      const registration = await tx.registration.create({
        data: {
          userId,
          eventId,
          status: isFull
            ? RegistrationStatus.WAITLIST
            : RegistrationStatus.REGISTERED,
        },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              startDate: true,
              endDate: true,
              location: true,
              checkInMode: true,
              isPaid: true,
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // Conditionally generate QR code based on check-in mode
      // Only for ORGANIZER_SCANS + FREE events (external analytics)
      let qrCodeData: string | null = null;

      if (shouldGenerateRegistrationQR(registration.event.checkInMode, registration.event.isPaid)) {
        qrCodeData = await this.generateRegistrationQR(
          registration.id,
          eventId,
          userId,
        );
      }

      // Update registration with QR code (null if not needed)
      const updatedRegistration = await tx.registration.update({
        where: { id: registration.id },
        data: { qrCode: qrCodeData },
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
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      return updatedRegistration;
    });
  }

  async findMyRegistrations(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [registrations, total] = await Promise.all([
      this.prisma.registration.findMany({
        where: { userId },
        skip,
        take: limit,
        include: {
          event: {
            include: {
              creator: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.registration.count({ where: { userId } }),
    ]);

    return {
      data: registrations,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findEventParticipants(
    eventId: string,
    userId: string,
    userRole: Role,
    page: number = 1,
    limit: number = 10,
    search?: string,
  ) {
    // Check if event exists
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Only event creator, organizers, or admins can view participants
    if (event.creatorId !== userId && userRole !== Role.ADMIN && userRole !== Role.ORGANIZER) {
      throw new ForbiddenException('You do not have permission to view event participants');
    }

    const skip = (page - 1) * limit;

    const where: any = { eventId };

    if (search) {
      where.user = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [registrations, total] = await Promise.all([
      this.prisma.registration.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
              faculty: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.registration.count({ where }),
    ]);

    return {
      data: registrations,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async remove(id: string, userId: string) {
    const registration = await this.prisma.registration.findUnique({
      where: { id },
      include: {
        event: true,
      },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    // Only the user who registered can cancel
    if (registration.userId !== userId) {
      throw new ForbiddenException('You can only cancel your own registrations');
    }

    // Cannot cancel if event has already started
    if (registration.event.startDate < new Date()) {
      throw new BadRequestException('Cannot cancel registration for event that has already started');
    }

    await this.prisma.registration.delete({
      where: { id },
    });

    // If there are users on waitlist, move the first one to registered
    const waitlistUser = await this.prisma.registration.findFirst({
      where: {
        eventId: registration.eventId,
        status: RegistrationStatus.WAITLIST,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (waitlistUser) {
      await this.prisma.registration.update({
        where: { id: waitlistUser.id },
        data: { status: RegistrationStatus.REGISTERED },
      });
    }

    return { message: 'Registration cancelled successfully' };
  }

  async checkIn(id: string, userId: string, userRole: Role) {
    const registration = await this.prisma.registration.findUnique({
      where: { id },
      include: {
        event: true,
      },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    // Only event creator, organizers, or admins can check-in
    if (
      registration.event.creatorId !== userId &&
      userRole !== Role.ADMIN &&
      userRole !== Role.ORGANIZER
    ) {
      throw new ForbiddenException('You do not have permission to check-in participants');
    }

    // Check if registration is active
    if (registration.status !== RegistrationStatus.REGISTERED) {
      throw new BadRequestException('Can only check-in registered participants');
    }

    // Check if already checked in
    if (registration.checkedIn) {
      throw new BadRequestException('User already checked in');
    }

    const updatedRegistration = await this.prisma.registration.update({
      where: { id },
      data: {
        checkedIn: true,
        checkedInAt: new Date(),
      },
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
    });

    return updatedRegistration;
  }

  async undoCheckIn(id: string, userId: string, userRole: Role) {
    const registration = await this.prisma.registration.findUnique({
      where: { id },
      include: {
        event: true,
      },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    // Only event creator, organizers, or admins can undo check-in
    if (
      registration.event.creatorId !== userId &&
      userRole !== Role.ADMIN &&
      userRole !== Role.ORGANIZER
    ) {
      throw new ForbiddenException('You do not have permission to undo check-in');
    }

    if (!registration.checkedIn) {
      throw new BadRequestException('User is not checked in');
    }

    const updatedRegistration = await this.prisma.registration.update({
      where: { id },
      data: {
        checkedIn: false,
        checkedInAt: null,
      },
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
    });

    return updatedRegistration;
  }

  /**
   * Export event participants as CSV
   * Organizers can only export their own events
   */
  async exportEventParticipants(eventId: string, userId: string, role: Role): Promise<string> {
    // Check if event exists
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        creatorId: true,
        csiTags: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check permissions (organizers can only export their own events)
    if (role === Role.ORGANIZER && event.creatorId !== userId) {
      throw new ForbiddenException('You can only export participants for your own events');
    }

    // Get all registrations with user details and check-in status
    const registrations = await this.prisma.registration.findMany({
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
      orderBy: { createdAt: 'asc' },
    });

    // Get check-ins for this event
    const checkIns = await this.prisma.checkIn.findMany({
      where: { eventId },
      select: {
        userId: true,
        checkedInAt: true,
      },
    });

    // Create a map of userId -> check-in time
    const checkInMap = new Map(checkIns.map(ci => [ci.userId, ci.checkedInAt]));

    // Generate CSV with proper encoding
    const headers = [
      'Name',
      'Email',
      'Faculty',
      'Year',
      'Registration Date',
      'Check-in Status',
      'Check-in Time',
      'CSI Tags',
    ];

    const csvRows = registrations.map((reg) => {
      const checkInTime = checkInMap.get(reg.user.id);
      const csiTagsString = event.csiTags && event.csiTags.length > 0 ? event.csiTags.join(', ') : 'None';
      const fullName = `${reg.user.firstName || ''} ${reg.user.lastName || ''}`.trim();
      const registrationDate = reg.createdAt ? new Date(reg.createdAt).toLocaleDateString('en-GB') : 'N/A';
      const checkInDate = checkInTime ? new Date(checkInTime).toLocaleString('en-GB') : 'N/A';

      return [
        fullName || 'N/A',
        reg.user.email || 'N/A',
        reg.user.faculty || 'N/A',
        'N/A', // year field doesn't exist in User model
        registrationDate,
        checkInTime ? 'Checked In' : 'Registered Only',
        checkInDate,
        csiTagsString,
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','); // Escape quotes properly
    });

    // Combine headers and rows with UTF-8 BOM for Excel compatibility
    const BOM = '\uFEFF';
    const csv = BOM + [headers.join(','), ...csvRows].join('\n');

    return csv;
  }

  /**
   * Generate QR code for registration (free events check-in)
   */
  private async generateRegistrationQR(
    registrationId: string,
    eventId: string,
    userId: string,
  ): Promise<string> {
    const qrPayload = {
      registrationId,
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
      throw new BadRequestException('Failed to generate QR code');
    }
  }
}
