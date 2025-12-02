import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePricingDto } from './dto/update-pricing.dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get current event pricing
   * Returns the first pricing record or creates default if none exists
   */
  async getPricing() {
    let pricing = await this.prisma.eventPricing.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    // Create default pricing if none exists
    if (!pricing) {
      pricing = await this.prisma.eventPricing.create({
        data: {
          basePrice: 5000.0,
          premiumPrice: 10000.0,
          packagePrice: 20000.0,
        },
      });
    }

    return pricing;
  }

  /**
   * Update event pricing (admin only)
   * Creates new pricing record instead of updating (for audit trail)
   */
  async updatePricing(updatePricingDto: UpdatePricingDto) {
    const pricing = await this.prisma.eventPricing.create({
      data: {
        basePrice: updatePricingDto.basePrice,
        premiumPrice: updatePricingDto.premiumPrice,
        packagePrice: updatePricingDto.packagePrice,
      },
    });

    return pricing;
  }

  /**
   * Get pricing history (for audit)
   */
  async getPricingHistory() {
    return this.prisma.eventPricing.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }
}
