import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { SubscriptionType } from '@prisma/client';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  // Pricing for subscriptions (тг/month)
  private readonly SUBSCRIPTION_PRICING = {
    PREMIUM: 500,
  };

  // Service listing limits
  private readonly SERVICE_LIMITS = {
    FREE: 3,
    PREMIUM: 10,
  };

  /**
   * Create premium subscription for student
   */
  async subscribe(userId: string, createDto: CreateSubscriptionDto) {
    const { type, durationMonths = 1 } = createDto;

    // Check if user already has active subscription
    const existingActive = await this.getActiveSubscription(userId);
    if (existingActive) {
      throw new BadRequestException('You already have an active subscription');
    }

    const pricePerMonth = this.SUBSCRIPTION_PRICING[type];
    const totalPrice = pricePerMonth * durationMonths;

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + durationMonths);

    return this.prisma.subscription.create({
      data: {
        userId,
        type,
        price: totalPrice,
        startDate,
        endDate,
        isActive: true,
      },
    });
  }

  /**
   * Get active subscription for user
   */
  async getActiveSubscription(userId: string) {
    const now = new Date();

    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Auto-deactivate expired subscriptions
    if (subscription && subscription.endDate < now) {
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { isActive: false },
      });
      return null;
    }

    return subscription;
  }

  /**
   * Get user's subscription history
   */
  async getMySubscriptions(userId: string) {
    return this.prisma.subscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Check if user can create more services
   */
  async canCreateService(userId: string): Promise<{
    canCreate: boolean;
    current: number;
    limit: number;
    isPremium: boolean;
  }> {
    // Check active subscription
    const subscription = await this.getActiveSubscription(userId);
    const isPremium = !!subscription;

    // Count active services
    const activeServicesCount = await this.prisma.service.count({
      where: {
        providerId: userId,
        isActive: true,
      },
    });

    const limit = isPremium
      ? this.SERVICE_LIMITS.PREMIUM
      : this.SERVICE_LIMITS.FREE;

    return {
      canCreate: activeServicesCount < limit,
      current: activeServicesCount,
      limit,
      isPremium,
    };
  }

  /**
   * Get subscription status for user
   */
  async getStatus(userId: string) {
    const activeSubscription = await this.getActiveSubscription(userId);
    const { canCreate, current, limit, isPremium } = await this.canCreateService(userId);

    return {
      hasActiveSubscription: !!activeSubscription,
      subscription: activeSubscription,
      isPremium,
      serviceListings: {
        current,
        limit,
        canCreateMore: canCreate,
      },
    };
  }

  /**
   * Get pricing information
   */
  async getPricing() {
    return {
      types: Object.entries(this.SUBSCRIPTION_PRICING).map(([type, pricePerMonth]) => ({
        type,
        pricePerMonth,
        benefits: this.getSubscriptionBenefits(type as SubscriptionType),
      })),
      serviceLimits: this.SERVICE_LIMITS,
    };
  }

  /**
   * Cancel subscription (admin only)
   */
  async cancelSubscription(subscriptionId: string) {
    return this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: { isActive: false },
    });
  }

  /**
   * Get subscription benefits description
   */
  private getSubscriptionBenefits(type: SubscriptionType): string[] {
    if (type === 'PREMIUM') {
      return [
        'Up to 10 service listings (vs 3 for free)',
        'Priority in search results',
        'Featured badge on listings',
        'Extended listing duration',
      ];
    }
    return [];
  }
}
