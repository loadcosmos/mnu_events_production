import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { AdPosition } from '@prisma/client';

@Injectable()
export class AdvertisementsService {
  constructor(private prisma: PrismaService) {}

  // Pricing for different ad positions (тг/week)
  private readonly AD_PRICING = {
    TOP_BANNER: 10000,
    NATIVE_FEED: 8000,
    STORY_BANNER: 15000,
    SIDEBAR: 6000,
    HERO_SLIDE: 12000, // Legacy
    BOTTOM_BANNER: 5000, // Legacy
  };

  /**
   * Get pricing for all ad positions
   */
  async getPricing() {
    return {
      positions: Object.entries(this.AD_PRICING).map(([position, pricePerWeek]) => ({
        position,
        pricePerWeek,
        description: this.getPositionDescription(position as AdPosition),
      })),
    };
  }

  /**
   * Create a new advertisement (goes to moderation)
   */
  async create(createAdDto: CreateAdDto) {
    const { position, duration } = createAdDto;

    // Calculate price
    const pricePerWeek = this.AD_PRICING[position];
    const totalPrice = pricePerWeek * duration;

    // Calculate dates
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + (duration * 7));

    const ad = await this.prisma.advertisement.create({
      data: {
        ...createAdDto,
        price: totalPrice,
        startDate: now,
        endDate,
        isActive: false, // Will be activated after payment and moderation
        paymentStatus: 'PENDING',
      },
    });

    // Add to moderation queue
    await this.prisma.moderationQueue.create({
      data: {
        itemType: 'ADVERTISEMENT',
        itemId: ad.id,
        status: 'PENDING',
      },
    });

    return ad;
  }

  /**
   * Get active advertisements by position
   */
  async getActiveAds(position?: AdPosition) {
    const where: any = {
      isActive: true,
      paymentStatus: 'PAID',
      startDate: { lte: new Date() },
      endDate: { gte: new Date() },
    };

    if (position) {
      where.position = position;
    }

    return this.prisma.advertisement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get all advertisements (admin/moderator)
   */
  async findAll() {
    return this.prisma.advertisement.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get advertisement by ID
   */
  async findOne(id: string) {
    const ad = await this.prisma.advertisement.findUnique({
      where: { id },
    });

    if (!ad) {
      throw new NotFoundException('Advertisement not found');
    }

    return ad;
  }

  /**
   * Update payment status (admin only)
   */
  async updatePaymentStatus(id: string, updateStatusDto: UpdatePaymentStatusDto) {
    const ad = await this.findOne(id);

    const updated = await this.prisma.advertisement.update({
      where: { id },
      data: {
        paymentStatus: updateStatusDto.status,
        // Activate if paid and approved
        isActive: updateStatusDto.status === 'PAID' && ad.isActive !== false,
      },
    });

    return updated;
  }

  /**
   * Track impression (view)
   */
  async trackImpression(id: string) {
    await this.prisma.advertisement.update({
      where: { id },
      data: {
        impressions: { increment: 1 },
      },
    });
  }

  /**
   * Track click
   */
  async trackClick(id: string) {
    await this.prisma.advertisement.update({
      where: { id },
      data: {
        clicks: { increment: 1 },
      },
    });
  }

  /**
   * Delete advertisement (admin only)
   */
  async remove(id: string) {
    await this.findOne(id);

    // Remove from moderation queue if exists
    await this.prisma.moderationQueue.deleteMany({
      where: {
        itemType: 'ADVERTISEMENT',
        itemId: id,
      },
    });

    return this.prisma.advertisement.delete({
      where: { id },
    });
  }

  /**
   * Get position description
   */
  private getPositionDescription(position: AdPosition): string {
    const descriptions = {
      TOP_BANNER: 'Top banner - High visibility',
      NATIVE_FEED: 'Native feed placement - In event/club listings',
      STORY_BANNER: 'Story banner - Vertical mobile format',
      SIDEBAR: 'Sidebar - Desktop only',
      HERO_SLIDE: 'Hero carousel slide (legacy)',
      BOTTOM_BANNER: 'Bottom banner (legacy)',
    };

    return descriptions[position] || 'Advertisement position';
  }
}
