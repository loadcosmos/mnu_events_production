import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { PartnerStatsDto } from './dto/partner-stats.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class PartnersService {
  private readonly logger = new Logger(PartnersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new external partner (ADMIN only)
   */
  async create(dto: CreatePartnerDto) {
    // 1. Check if user exists and has EXTERNAL_PARTNER role
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== 'EXTERNAL_PARTNER') {
      throw new BadRequestException('User must have EXTERNAL_PARTNER role');
    }

    // 2. Check if partner already exists for this user
    const existingPartner = await this.prisma.externalPartner.findUnique({
      where: { userId: dto.userId },
    });

    if (existingPartner) {
      throw new ConflictException('Partner already exists for this user');
    }

    // 3. Check if BIN is unique
    const existingBin = await this.prisma.externalPartner.findFirst({
      where: { bin: dto.bin },
    });

    if (existingBin) {
      throw new ConflictException('Partner with this BIN already exists');
    }

    // 4. Create partner
    const partner = await this.prisma.externalPartner.create({
      data: {
        userId: dto.userId,
        companyName: dto.companyName,
        bin: dto.bin,
        contactPerson: dto.contactPerson,
        phone: dto.phone,
        email: dto.email,
        whatsapp: dto.whatsapp,
        kaspiPhone: dto.kaspiPhone,
        kaspiName: dto.kaspiName,
        commissionRate: dto.commissionRate
          ? new Decimal(dto.commissionRate)
          : new Decimal(0.10), // Default 10%
        isVerified: true,
        verifiedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    this.logger.log(`External partner created: ${partner.companyName} (${partner.id})`);

    return partner;
  }

  /**
   * Get all partners (ADMIN only)
   */
  async findAll(filters?: { isVerified?: boolean; hasPremium?: boolean }) {
    const where: any = {};

    if (filters?.isVerified !== undefined) {
      where.isVerified = filters.isVerified;
    }

    if (filters?.hasPremium !== undefined) {
      where.hasPremiumSubscription = filters.hasPremium;
    }

    return this.prisma.externalPartner.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get partner by ID (ADMIN only)
   */
  async findOne(id: string) {
    const partner = await this.prisma.externalPartner.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        events: {
          select: {
            id: true,
            title: true,
            status: true,
            isPaid: true,
            price: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!partner) {
      throw new NotFoundException('Partner not found');
    }

    return partner;
  }

  /**
   * Get partner by user ID
   */
  async findByUserId(userId: string) {
    const partner = await this.prisma.externalPartner.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!partner) {
      throw new NotFoundException('Partner not found for this user');
    }

    return partner;
  }

  /**
   * Update partner (ADMIN can update any, PARTNER can update own)
   */
  async update(id: string, dto: UpdatePartnerDto, userId?: string) {
    const partner = await this.prisma.externalPartner.findUnique({
      where: { id },
    });

    if (!partner) {
      throw new NotFoundException('Partner not found');
    }

    // If userId provided, check ownership
    if (userId && partner.userId !== userId) {
      throw new BadRequestException('You can only update your own partner profile');
    }

    // Prepare update data
    const updateData: any = {};

    if (dto.companyName) updateData.companyName = dto.companyName;
    if (dto.bin) {
      // Check BIN uniqueness if changing
      if (dto.bin !== partner.bin) {
        const existingBin = await this.prisma.externalPartner.findFirst({
          where: { bin: dto.bin, NOT: { id } },
        });
        if (existingBin) {
          throw new ConflictException('Partner with this BIN already exists');
        }
      }
      updateData.bin = dto.bin;
    }
    if (dto.contactPerson) updateData.contactPerson = dto.contactPerson;
    if (dto.phone) updateData.phone = dto.phone;
    if (dto.email) updateData.email = dto.email;
    if (dto.whatsapp) updateData.whatsapp = dto.whatsapp;
    if (dto.kaspiPhone) updateData.kaspiPhone = dto.kaspiPhone;
    if (dto.kaspiName) updateData.kaspiName = dto.kaspiName;
    if (dto.commissionRate !== undefined) {
      updateData.commissionRate = new Decimal(dto.commissionRate);
    }

    return this.prisma.externalPartner.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Delete partner (ADMIN only)
   */
  async remove(id: string) {
    const partner = await this.prisma.externalPartner.findUnique({
      where: { id },
      include: {
        events: {
          where: {
            status: { in: ['UPCOMING', 'ONGOING'] },
          },
        },
      },
    });

    if (!partner) {
      throw new NotFoundException('Partner not found');
    }

    // Check if partner has active events
    if (partner.events.length > 0) {
      throw new BadRequestException(
        'Cannot delete partner with active events. Cancel or complete events first.',
      );
    }

    await this.prisma.externalPartner.delete({
      where: { id },
    });

    this.logger.log(`External partner deleted: ${partner.companyName} (${id})`);

    return { message: 'Partner deleted successfully' };
  }

  /**
   * Get partner statistics
   */
  async getStats(userId: string): Promise<PartnerStatsDto> {
    const partner = await this.findByUserId(userId);

    // Get active events count
    const activeEventsCount = await this.prisma.event.count({
      where: {
        externalPartnerId: partner.id,
        status: { in: ['UPCOMING', 'ONGOING'] },
      },
    });

    // Calculate event limit
    const eventLimit = 1 + partner.paidEventSlots; // 1 free + paid slots

    return {
      totalEventsCreated: partner.totalEventsCreated,
      activeEventsCount,
      totalTicketsSold: partner.totalTicketsSold,
      totalRevenue: Number(partner.totalRevenue),
      commissionDebt: Number(partner.commissionDebt),
      totalCommissionPaid: Number(partner.totalCommissionPaid),
      commissionRate: Number(partner.commissionRate),
      paidEventSlots: partner.paidEventSlots,
      eventLimit,
    };
  }

  /**
   * Add paid event slots (ADMIN only)
   */
  async addPaidSlots(id: string, slotsToAdd: number) {
    if (slotsToAdd < 1) {
      throw new BadRequestException('Must add at least 1 slot');
    }

    const partner = await this.prisma.externalPartner.update({
      where: { id },
      data: {
        paidEventSlots: {
          increment: slotsToAdd,
        },
      },
    });

    this.logger.log(`Added ${slotsToAdd} paid slots to partner ${partner.companyName}`);

    return partner;
  }

  /**
   * Update commission rate (ADMIN only)
   */
  async updateCommissionRate(id: string, rate: number) {
    if (rate < 0 || rate > 0.5) {
      throw new BadRequestException('Commission rate must be between 0 and 0.5 (0%-50%)');
    }

    return this.prisma.externalPartner.update({
      where: { id },
      data: {
        commissionRate: new Decimal(rate),
      },
    });
  }

  /**
   * Mark commission as paid (ADMIN only)
   */
  async markCommissionPaid(id: string, amount: number) {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const partner = await this.prisma.externalPartner.findUnique({
      where: { id },
    });

    if (!partner) {
      throw new NotFoundException('Partner not found');
    }

    if (Number(partner.commissionDebt) < amount) {
      throw new BadRequestException('Payment amount exceeds commission debt');
    }

    return this.prisma.externalPartner.update({
      where: { id },
      data: {
        commissionDebt: {
          decrement: new Decimal(amount),
        },
        totalCommissionPaid: {
          increment: new Decimal(amount),
        },
      },
    });
  }

  /**
   * Check if partner can create event (based on limits)
   */
  async canCreateEvent(userId: string): Promise<{
    allowed: boolean;
    reason?: string;
    currentEvents?: number;
    limit?: number;
  }> {
    const partner = await this.findByUserId(userId);

    const activeEvents = await this.prisma.event.count({
      where: {
        externalPartnerId: partner.id,
        status: { in: ['UPCOMING', 'ONGOING'] },
      },
    });

    const freeLimit = 1;
    const totalLimit = freeLimit + partner.paidEventSlots;

    if (activeEvents >= totalLimit) {
      return {
        allowed: false,
        reason: 'EVENT_LIMIT_REACHED',
        currentEvents: activeEvents,
        limit: totalLimit,
      };
    }

    return {
      allowed: true,
      currentEvents: activeEvents,
      limit: totalLimit,
    };
  }
}
