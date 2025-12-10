import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { ModerationService } from '../moderation/moderation.service';
import { PartnersService } from '../partners/partners.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { FilterEventsDto } from './dto/filter-events.dto';
import { Role, Prisma, ModerationType } from '@prisma/client';
import {
  validatePagination,
  createPaginatedResponse,
  requireCreatorOrAdmin,
  validateEventListing,
  sanitizeSearchQuery,
} from '../common/utils';
import { determineCheckInMode } from '../common/utils/checkin-mode.utils';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private prisma: PrismaService,
    private moderationService: ModerationService,
    private partnersService: PartnersService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) { }

  async create(createEventDto: CreateEventDto, userId: string, userRole: Role) {
    // Validate dates
    const startDate = new Date(createEventDto.startDate);
    const endDate = new Date(createEventDto.endDate);

    if (startDate >= endDate) {
      throw new BadRequestException('End date must be after start date');
    }

    if (startDate < new Date()) {
      throw new BadRequestException('Start date cannot be in the past');
    }

    // Check partner event limits (for EXTERNAL_PARTNER role)
    let externalPartnerId: string | null = null;
    if (userRole === Role.EXTERNAL_PARTNER) {
      const limitCheck = await this.partnersService.canCreateEvent(userId);

      if (!limitCheck.allowed) {
        throw new ForbiddenException({
          code: 'EVENT_LIMIT_REACHED',
          message: 'Достигнут лимит мероприятий',
          currentEvents: limitCheck.currentEvents,
          limit: limitCheck.limit,
          additionalSlotPrice: 3000,
        });
      }

      // Get partner ID to link event
      const partner = await this.partnersService.findByUserId(userId);
      externalPartnerId = partner.id;

      this.logger.log(`External partner ${partner.companyName} creating event (${limitCheck.currentEvents}/${limitCheck.limit})`);
    }

    // Moderation logic:
    // - ADMIN/MODERATOR: create with UPCOMING status (auto-approved)
    // - ORGANIZER: create with PENDING_MODERATION status + add to queue + validate filters
    const needsModeration = userRole !== Role.ADMIN && userRole !== Role.MODERATOR;

    // Apply automatic moderation filters for organizers
    if (needsModeration) {
      validateEventListing(
        createEventDto.title,
        createEventDto.description,
        createEventDto.isPaid || false,
        createEventDto.price ? Number(createEventDto.price) : undefined,
      );
    }

    // Determine check-in mode based on event type
    const checkInMode = determineCheckInMode({
      isPaid: createEventDto.isPaid || false,
      isExternalEvent: externalPartnerId !== null,
    });

    const event = await this.prisma.event.create({
      data: {
        ...createEventDto,
        startDate,
        endDate,
        creatorId: userId,
        status: needsModeration ? 'PENDING_MODERATION' : 'UPCOMING',
        isExternalEvent: externalPartnerId !== null,
        externalPartnerId: externalPartnerId,
        checkInMode: checkInMode,
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        externalPartner: externalPartnerId ? {
          select: {
            id: true,
            companyName: true,
            kaspiPhone: true,
            kaspiName: true,
          },
        } : undefined,
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    if (needsModeration) {
      // Organizers must go through moderation
      await this.moderationService.addToQueue(ModerationType.EVENT, event.id);
      this.logger.log(`Event added to moderation queue: ${event.id}`);
    } else {
      // Admin/Moderator events are auto-approved
      this.logger.log(`Event created by ${userRole}, auto-approved`);
    }

    return event;
  }

  async findAll(
    page?: number,
    limit?: number,
    filterDto?: FilterEventsDto,
  ) {
    const { skip, take, page: validatedPage } = validatePagination({ page, limit });

    const where: Prisma.EventWhereInput = {};

    if (filterDto?.category) {
      where.category = filterDto.category;
    }

    if (filterDto?.status) {
      where.status = filterDto.status;
    } else {
      // CRITICAL FIX: By default, exclude PENDING_MODERATION events from public view
      // Students should only see approved/upcoming events
      // Only when explicitly filtering by status (e.g., admins/moderators viewing queue)
      // will PENDING_MODERATION events be shown
      where.status = {
        notIn: ['PENDING_MODERATION'],
      };
    }

    if (filterDto?.startDateFrom || filterDto?.startDateTo) {
      where.startDate = {};
      if (filterDto.startDateFrom) {
        where.startDate.gte = new Date(filterDto.startDateFrom);
      }
      if (filterDto.startDateTo) {
        where.startDate.lte = new Date(filterDto.startDateTo);
      }
    }

    if (filterDto?.search) {
      // SECURITY FIX: Sanitize search input to prevent ReDoS and resource exhaustion
      const sanitizedSearch = sanitizeSearchQuery(filterDto.search);

      if (sanitizedSearch) {
        // Note: mode: 'insensitive' only works with String fields, not Text fields
        // description is @db.Text, so we can't use mode: 'insensitive' for it
        where.OR = [
          { title: { contains: sanitizedSearch, mode: 'insensitive' } },
          { location: { contains: sanitizedSearch, mode: 'insensitive' } },
          // description is Text field, so we search it case-sensitively
          { description: { contains: sanitizedSearch } },
          // Search by organizer's first name
          {
            creator: {
              firstName: { contains: sanitizedSearch, mode: 'insensitive' }
            }
          },
          // Search by organizer's last name
          {
            creator: {
              lastName: { contains: sanitizedSearch, mode: 'insensitive' }
            }
          },
          // Search by organizer's email
          {
            creator: {
              email: { contains: sanitizedSearch, mode: 'insensitive' }
            }
          },
        ];
      }
    }

    if (filterDto?.creatorId) {
      where.creatorId = filterDto.creatorId;
    }

    // CSI Tags filtering: event must have ALL selected tags
    if (filterDto?.csiTags) {
      const csiTagsArray = filterDto.csiTags.split(',').map(tag => tag.trim()).filter(tag => tag) as unknown as import('@prisma/client').CsiCategory[];
      if (csiTagsArray.length > 0) {
        where.csiTags = {
          hasEvery: csiTagsArray,
        };
      }
    }

    try {
      const [events, total] = await Promise.all([
        this.prisma.event.findMany({
          where,
          skip,
          take,
          include: {
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            _count: {
              select: {
                registrations: true,
              },
            },
          },
          orderBy: { startDate: 'asc' },
        }),
        this.prisma.event.count({ where }),
      ]);

      return createPaginatedResponse(events, total, validatedPage, take);
    } catch (error) {
      this.logger.error('findAll error:', error);
      throw error;
    }
  }

  /**
   * Get trending/popular events with Redis caching
   * Used on HomePage for quick loading
   */
  async getTrendingEvents(limit: number = 6) {
    const cacheKey = `events:trending:${limit}`;

    // Check cache first
    const cachedResult = await this.cacheManager.get(cacheKey);
    if (cachedResult) {
      this.logger.debug('Trending events cache HIT');
      return cachedResult;
    }
    this.logger.debug('Trending events cache MISS');

    // Fetch from DB: upcoming events sorted by registration count
    const events = await this.prisma.event.findMany({
      where: {
        status: 'UPCOMING',
        startDate: { gte: new Date() },
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: { registrations: true },
        },
      },
      orderBy: [
        { registrations: { _count: 'desc' } },
        { createdAt: 'desc' },
      ],
      take: limit,
    });

    // Cache for 5 minutes (300000 ms)
    await this.cacheManager.set(cacheKey, events, 300000);
    this.logger.debug('Trending events cached');

    return events;
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Calculate available seats
    const availableSeats = event.capacity - event._count.registrations;

    return {
      ...event,
      availableSeats,
    };
  }

  async update(id: string, updateEventDto: UpdateEventDto, userId: string, userRole: Role) {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Only creator or admin can update
    requireCreatorOrAdmin(userId, event.creatorId, userRole, 'event');

    // Validate dates if provided
    if (updateEventDto.startDate || updateEventDto.endDate) {
      const startDate = updateEventDto.startDate ? new Date(updateEventDto.startDate) : event.startDate;
      const endDate = updateEventDto.endDate ? new Date(updateEventDto.endDate) : event.endDate;

      if (startDate >= endDate) {
        throw new BadRequestException('End date must be after start date');
      }
    }

    // Edge Case 1: Prevent changing isPaid if students have already registered
    if (updateEventDto.isPaid !== undefined && updateEventDto.isPaid !== event.isPaid) {
      const registrationCount = await this.prisma.registration.count({
        where: { eventId: id },
      });

      if (registrationCount > 0) {
        throw new BadRequestException(
          'Cannot change payment status after students have registered. Please create a new event.'
        );
      }
    }

    const updatedEvent = await this.prisma.event.update({
      where: { id },
      data: {
        ...updateEventDto,
        startDate: updateEventDto.startDate ? new Date(updateEventDto.startDate) : undefined,
        endDate: updateEventDto.endDate ? new Date(updateEventDto.endDate) : undefined,
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    return updatedEvent;
  }

  async remove(id: string, userId: string, userRole: Role) {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Only creator or admin can delete
    requireCreatorOrAdmin(userId, event.creatorId, userRole, 'event');

    await this.prisma.event.delete({
      where: { id },
    });

    return { message: 'Event deleted successfully' };
  }

  async getMyEvents(userId: string, page?: number, limit?: number) {
    // For organizers viewing their own events, we need to show ALL statuses
    // including PENDING_MODERATION, so we pass an empty status filter
    // This overrides the default filter that excludes PENDING_MODERATION
    const { skip, take, page: validatedPage } = validatePagination({ page, limit });

    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where: { creatorId: userId },
        skip,
        take,
        orderBy: { startDate: 'desc' },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          externalPartner: {
            select: {
              id: true,
              companyName: true,
            },
          },
          _count: {
            select: {
              registrations: true,
              tickets: true,
            },
          },
        },
      }),
      this.prisma.event.count({ where: { creatorId: userId } }),
    ]);

    return createPaginatedResponse(events, total, validatedPage, take);
  }

  /**
   * Get recommended events based on user preferences
   * Scoring algorithm:
   * - Category match: +3 points
   * - CSI tag match: +2 points per tag
   * - Day match: +1 point
   * - Time slot match: +1 point
   * - Popularity boost: +0.1 per registration (max +2)
   */
  async getRecommendedEvents(userId: string, limit: number = 12) {
    // Check Redis cache first
    const cacheKey = `recommendations:${userId}:${limit}`;
    const cachedResult = await this.cacheManager.get(cacheKey);
    if (cachedResult) {
      this.logger.debug(`Recommendations cache HIT for user ${userId}`);
      return cachedResult;
    }
    this.logger.debug(`Recommendations cache MISS for user ${userId}`);

    // 1. Get user preferences
    const preferences = await this.prisma.userPreference.findUnique({
      where: { userId }
    });

    if (!preferences || !preferences.onboardingCompleted) {
      // Fallback: return popular upcoming events
      return this.prisma.event.findMany({
        where: {
          status: 'UPCOMING',
          startDate: { gte: new Date() }
        },
        orderBy: [
          { registrations: { _count: 'desc' } },
          { createdAt: 'desc' }
        ],
        take: limit,
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          _count: {
            select: { registrations: true }
          }
        }
      });
    }

    // 2. Get all upcoming published events
    const events = await this.prisma.event.findMany({
      where: {
        status: 'UPCOMING',
        startDate: { gte: new Date() }
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        _count: {
          select: { registrations: true }
        }
      }
    });

    // 3. Score each event based on preferences
    const scoredEvents = events.map(event => {
      let score = 0;

      // Category match: +3 points
      if (preferences.preferredCategories.includes(event.category)) {
        score += 3;
      }

      // CSI tag match: +2 points per tag
      const eventCsiTags = event.csiTags || [];
      const matchingCsiTags = eventCsiTags.filter(tag =>
        preferences.preferredCsiTags.includes(tag)
      );
      score += matchingCsiTags.length * 2;

      // Day match: +1 point
      const eventDay = new Date(event.startDate).toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
      if (preferences.availableDays.includes(eventDay)) {
        score += 1;
      }

      // Time slot match: +1 point
      const eventHour = new Date(event.startDate).getHours();
      const eventTimeSlot =
        eventHour < 12 ? 'MORNING' :
          eventHour < 17 ? 'AFTERNOON' : 'EVENING';
      if (preferences.preferredTimeSlot?.toUpperCase() === eventTimeSlot) {
        score += 1;
      }

      // Popularity boost: +0.1 per registration (max +2)
      const popularityScore = Math.min(event._count.registrations * 0.1, 2);
      score += popularityScore;

      return { event, score };
    });

    // 4. Sort by score and return top N
    const topEvents = scoredEvents
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.event);

    // Cache results for 10 minutes (600000 ms)
    await this.cacheManager.set(cacheKey, topEvents, 600000);
    this.logger.debug(`Recommendations cached for user ${userId}`);

    return topEvents;
  }

  async getEventStatistics(eventId: string, userId: string, userRole: Role) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // SECURITY FIX: Explicit authorization check
    // Only event creator or ADMIN role can view statistics
    // ORGANIZER role alone is not sufficient - must be the event creator
    if (userRole === Role.ADMIN) {
      // Admin can view any event statistics
    } else if (event.creatorId === userId) {
      // Event creator can view their own event statistics
    } else {
      // All other cases denied (including ORGANIZER who didn't create this event)
      throw new ForbiddenException('You do not have permission to view event statistics');
    }

    const registrations = await this.prisma.registration.groupBy({
      by: ['status'],
      where: { eventId },
      _count: true,
    });

    const checkedInCount = await this.prisma.registration.count({
      where: { eventId, checkedIn: true },
    });

    return {
      eventId: event.id,
      title: event.title,
      capacity: event.capacity,
      totalRegistrations: event._count.registrations,
      availableSeats: event.capacity - event._count.registrations,
      checkedInCount,
      registrationsByStatus: registrations.map(r => ({
        status: r.status,
        count: r._count,
      })),
    };
  }
}
