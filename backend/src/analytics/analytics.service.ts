import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { OrganizerStatsDto } from './dto/organizer-stats.dto';
import { StudentStatsDto } from './dto/student-stats.dto';
import { RevenueStatsDto } from './dto/revenue-stats.dto';
import { Role } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get dashboard statistics (ADMIN only)
   */
  async getDashboardStats(): Promise<DashboardStatsDto> {
    const [
      totalEvents,
      totalUsers,
      ticketStats,
      eventsByCategory,
      topEvents,
    ] = await Promise.all([
      // Total events
      this.prisma.event.count(),

      // Total users
      this.prisma.user.count(),

      // Ticket statistics
      this.prisma.ticket.aggregate({
        where: { status: { in: ['PAID', 'USED'] } },
        _sum: {
          price: true,
          platformFee: true,
        },
        _count: true,
      }),

      // Events by category
      this.prisma.event.groupBy({
        by: ['category'],
        _count: true,
      }),

      // Top 10 events by registrations
      this.prisma.event.findMany({
        take: 10,
        select: {
          id: true,
          title: true,
          category: true,
          startDate: true,
          _count: {
            select: {
              registrations: true,
              tickets: true,
            },
          },
        },
        orderBy: {
          registrations: {
            _count: 'desc',
          },
        },
      }),
    ]);

    // Calculate total revenue
    const totalRevenue =
      (ticketStats._sum.price?.toNumber() || 0) +
      (ticketStats._sum.platformFee?.toNumber() || 0);

    // Get revenue by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const revenueByMonth = await this.getRevenueByMonth(sixMonthsAgo);

    return {
      totalEvents,
      totalUsers,
      totalRevenue,
      totalTicketsSold: ticketStats._count,
      eventsByCategory: eventsByCategory.map((item) => ({
        category: item.category,
        count: item._count,
      })),
      revenueByMonth,
      topEvents: topEvents.map((event) => ({
        ...event,
        totalParticipants: event._count.registrations + event._count.tickets,
      })),
    };
  }

  /**
   * Get organizer statistics
   */
  async getOrganizerStats(userId: string, requesterId: string, requesterRole: Role): Promise<OrganizerStatsDto> {
    // Authorization: Only self or admin can view
    if (userId !== requesterId && requesterRole !== Role.ADMIN) {
      throw new ForbiddenException('Access denied');
    }

    const organizer = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!organizer) {
      throw new NotFoundException('User not found');
    }

    const [
      totalEvents,
      upcomingEvents,
      registrationsCount,
      checkInsCount,
      revenueData,
      eventPerformance,
    ] = await Promise.all([
      // Total events created
      this.prisma.event.count({
        where: { creatorId: userId },
      }),

      // Upcoming events
      this.prisma.event.count({
        where: {
          creatorId: userId,
          status: 'UPCOMING',
          startDate: { gte: new Date() },
        },
      }),

      // Total registrations
      this.prisma.registration.count({
        where: {
          event: { creatorId: userId },
        },
      }),

      // Total check-ins
      this.prisma.checkIn.count({
        where: {
          event: { creatorId: userId },
        },
      }),

      // Revenue statistics
      this.prisma.ticket.aggregate({
        where: {
          event: { creatorId: userId },
          status: { in: ['PAID', 'USED'] },
        },
        _sum: {
          price: true,
          platformFee: true,
        },
      }),

      // Event performance
      this.prisma.event.findMany({
        where: { creatorId: userId },
        select: {
          id: true,
          title: true,
          _count: {
            select: {
              registrations: true,
              checkIns: true,
            },
          },
          tickets: {
            where: { status: { in: ['PAID', 'USED'] } },
            select: {
              price: true,
              platformFee: true,
            },
          },
        },
        orderBy: { startDate: 'desc' },
      }),
    ]);

    const revenueGenerated =
      (revenueData._sum.price?.toNumber() || 0) +
      (revenueData._sum.platformFee?.toNumber() || 0);

    const checkInRate = registrationsCount > 0 ? (checkInsCount / registrationsCount) * 100 : 0;

    return {
      totalEvents,
      upcomingEvents,
      totalRegistrations: registrationsCount,
      totalCheckIns: checkInsCount,
      checkInRate: Math.round(checkInRate * 10) / 10,
      revenueGenerated,
      eventPerformance: eventPerformance.map((event) => {
        const eventCheckInRate = event._count.registrations > 0
          ? (event._count.checkIns / event._count.registrations) * 100
          : 0;
        return {
          eventId: event.id,
          title: event.title,
          registrations: event._count.registrations,
          checkIns: event._count.checkIns,
          checkInRate: Math.round(eventCheckInRate * 10) / 10,
          revenue: event.tickets.reduce(
            (sum, ticket) =>
              sum + ticket.price.toNumber() + ticket.platformFee.toNumber(),
            0,
          ),
        };
      }),
    };
  }

  /**
   * Get student statistics
   */
  async getStudentStats(userId: string, requesterId: string, requesterRole: Role): Promise<StudentStatsDto> {
    // Authorization: Only self or admin can view
    if (userId !== requesterId && requesterRole !== Role.ADMIN) {
      throw new ForbiddenException('Access denied');
    }

    const student = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!student) {
      throw new NotFoundException('User not found');
    }

    const [
      eventsAttended,
      upcomingEvents,
      clubMemberships,
      ticketsPurchased,
    ] = await Promise.all([
      // Events attended (checked in)
      this.prisma.checkIn.count({
        where: { userId },
      }),

      // Upcoming registered events
      this.prisma.registration.count({
        where: {
          userId,
          status: 'REGISTERED',
          event: {
            startDate: { gte: new Date() },
          },
        },
      }),

      // Club memberships
      this.prisma.clubMembership.count({
        where: { userId },
      }),

      // Tickets purchased
      this.prisma.ticket.count({
        where: {
          userId,
          status: { in: ['PAID', 'USED'] },
        },
      }),
    ]);

    // Calculate badges
    const badges = [
      {
        name: '⭐ Новичок',
        unlocked: eventsAttended >= 5,
        requirement: 'Посетить 5 событий',
        progress: eventsAttended,
        target: 5,
      },
      {
        name: '⭐⭐ Активист',
        unlocked: eventsAttended >= 10,
        requirement: 'Посетить 10 событий',
        progress: eventsAttended,
        target: 10,
      },
      {
        name: '⭐⭐⭐ Энтузиаст',
        unlocked: eventsAttended >= 20,
        requirement: 'Посетить 20 событий',
        progress: eventsAttended,
        target: 20,
      },
      {
        name: '👥 Социальная бабочка',
        unlocked: clubMemberships >= 3,
        requirement: 'Вступить в 3 клуба',
        progress: clubMemberships,
        target: 3,
      },
    ];

    return {
      eventsAttended,
      upcomingEvents,
      clubMemberships,
      ticketsPurchased,
      badges,
    };
  }

  /**
   * Get revenue statistics (ADMIN only)
   */
  async getRevenueStats(): Promise<RevenueStatsDto> {
    const [ticketRevenue, platformFeesData, topRevenueEvents] = await Promise.all([
      // Ticket revenue
      this.prisma.ticket.aggregate({
        where: { status: { in: ['PAID', 'USED'] } },
        _sum: {
          price: true,
          platformFee: true,
        },
      }),

      // Platform fees
      this.prisma.ticket.aggregate({
        where: { status: { in: ['PAID', 'USED'] } },
        _sum: {
          platformFee: true,
        },
      }),

      // Top revenue events
      this.prisma.event.findMany({
        where: { isPaid: true },
        select: {
          id: true,
          title: true,
          tickets: {
            where: { status: { in: ['PAID', 'USED'] } },
            select: {
              price: true,
              platformFee: true,
            },
          },
        },
        take: 10,
      }),
    ]);

    const totalTicketRevenue = ticketRevenue._sum.price?.toNumber() || 0;
    const platformFees = platformFeesData._sum.platformFee?.toNumber() || 0;
    
    // Ad revenue tracking: Phase 2 feature
    // Will be implemented when advertisement payment integration is completed
    // This requires tracking advertisement impressions, clicks, and conversions
    const adRevenue = 0;

    // Get revenue by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const revenueByMonth = await this.getRevenueByMonthDetailed(sixMonthsAgo);

    // Process top revenue events
    const processedTopEvents = topRevenueEvents
      .map((event) => {
        const revenue = event.tickets.reduce(
          (sum, ticket) =>
            sum + ticket.price.toNumber() + ticket.platformFee.toNumber(),
          0,
        );
        return {
          eventId: event.id,
          title: event.title,
          ticketsSold: event.tickets.length,
          revenue,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);

    return {
      totalRevenue: totalTicketRevenue + platformFees + adRevenue,
      ticketRevenue: totalTicketRevenue,
      adRevenue,
      platformFees,
      revenueByMonth,
      topRevenueEvents: processedTopEvents,
    };
  }

  /**
   * Get detailed event statistics
   */
  async getEventStats(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            registrations: true,
            checkIns: true,
            tickets: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    let revenue = 0;
    if (event.isPaid) {
      const ticketRevenue = await this.prisma.ticket.aggregate({
        where: {
          eventId,
          status: { in: ['PAID', 'USED'] },
        },
        _sum: {
          price: true,
          platformFee: true,
        },
      });
      revenue =
        (ticketRevenue._sum.price?.toNumber() || 0) +
        (ticketRevenue._sum.platformFee?.toNumber() || 0);
    }

    const totalParticipants = event._count.registrations + event._count.tickets;
    const checkInRate = totalParticipants > 0 ? (event._count.checkIns / totalParticipants) * 100 : 0;

    return {
      event: {
        id: event.id,
        title: event.title,
        category: event.category,
        isPaid: event.isPaid,
        capacity: event.capacity,
      },
      creator: event.creator,
      stats: {
        totalRegistrations: event._count.registrations,
        totalTickets: event._count.tickets,
        totalCheckIns: event._count.checkIns,
        checkInRate: Math.round(checkInRate * 10) / 10,
        revenue,
      },
    };
  }

  /**
   * Helper: Get revenue by month
   */
  private async getRevenueByMonth(since: Date) {
    const tickets = await this.prisma.ticket.findMany({
      where: {
        status: { in: ['PAID', 'USED'] },
        purchasedAt: { gte: since },
      },
      select: {
        purchasedAt: true,
        price: true,
        platformFee: true,
      },
    });

    const revenueMap = new Map<string, number>();

    tickets.forEach((ticket) => {
      const month = ticket.purchasedAt.toISOString().slice(0, 7); // YYYY-MM
      const revenue = ticket.price.toNumber() + ticket.platformFee.toNumber();
      revenueMap.set(month, (revenueMap.get(month) || 0) + revenue);
    });

    return Array.from(revenueMap.entries())
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * Helper: Get detailed revenue by month
   */
  private async getRevenueByMonthDetailed(since: Date) {
    const tickets = await this.prisma.ticket.findMany({
      where: {
        status: { in: ['PAID', 'USED'] },
        purchasedAt: { gte: since },
      },
      select: {
        purchasedAt: true,
        price: true,
        platformFee: true,
      },
    });

    const revenueMap = new Map<string, { tickets: number; ads: number; platformFees: number }>();

    tickets.forEach((ticket) => {
      const month = ticket.purchasedAt.toISOString().slice(0, 7);
      const current = revenueMap.get(month) || { tickets: 0, ads: 0, platformFees: 0 };
      current.tickets += ticket.price.toNumber();
      current.platformFees += ticket.platformFee.toNumber();
      revenueMap.set(month, current);
    });

    return Array.from(revenueMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * Get student CSI statistics
   * Calculates participation across Creativity, Service, Intelligence categories
   */
  async getStudentCsiStats(userId: string) {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get all check-ins for this student with event CSI tags
    const checkIns = await this.prisma.checkIn.findMany({
      where: { userId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            csiTags: true,
            category: true,
            startDate: true,
            endDate: true,
          },
        },
      },
      orderBy: { checkedInAt: 'desc' },
    });

    // Initialize CSI breakdown
    const csiBreakdown: {
      [key: string]: {
        events: number;
        eventIds: Set<string>;
        eventDetails: Array<{
          id: string;
          title: string;
          category: string;
          date: Date;
        }>;
      };
    } = {
      CREATIVITY: { events: 0, eventIds: new Set<string>(), eventDetails: [] },
      SERVICE: { events: 0, eventIds: new Set<string>(), eventDetails: [] },
      INTELLIGENCE: { events: 0, eventIds: new Set<string>(), eventDetails: [] },
    };

    // Count events per CSI category
    checkIns.forEach((checkIn) => {
      const csiTags = checkIn.event.csiTags || [];

      csiTags.forEach((tag) => {
        if (csiBreakdown[tag]) {
          // Only count each event once per CSI category
          if (!csiBreakdown[tag].eventIds.has(checkIn.event.id)) {
            csiBreakdown[tag].eventIds.add(checkIn.event.id);
            csiBreakdown[tag].events += 1;
            csiBreakdown[tag].eventDetails.push({
              id: checkIn.event.id,
              title: checkIn.event.title,
              category: checkIn.event.category,
              date: checkIn.event.startDate,
            });
          }
        }
      });
    });

    // Calculate totals
    const totalCsiEvents = checkIns.filter(c => c.event.csiTags && c.event.csiTags.length > 0).length;
    const totalEvents = checkIns.length;

    // Format response
    return {
      userId: user.id,
      totalEvents,
      totalCsiEvents,
      csiBreakdown: {
        creativity: {
          events: csiBreakdown.CREATIVITY.events,
          recentEvents: csiBreakdown.CREATIVITY.eventDetails.slice(0, 5),
        },
        service: {
          events: csiBreakdown.SERVICE.events,
          recentEvents: csiBreakdown.SERVICE.eventDetails.slice(0, 5),
        },
        intelligence: {
          events: csiBreakdown.INTELLIGENCE.events,
          recentEvents: csiBreakdown.INTELLIGENCE.eventDetails.slice(0, 5),
        },
      },
      requirements: {
        // No hard requirements - just tracking
        creativity: { completed: csiBreakdown.CREATIVITY.events, status: 'tracking' },
        service: { completed: csiBreakdown.SERVICE.events, status: 'tracking' },
        intelligence: { completed: csiBreakdown.INTELLIGENCE.events, status: 'tracking' },
      },
    };
  }
}
