import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePlatformSettingsDto } from './dto/update-platform-settings.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class PlatformSettingsService implements OnModuleInit {
  private readonly logger = new Logger(PlatformSettingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // Auto-create default settings if none exist
    await this.ensureDefaultSettings();
  }

  /**
   * Ensure that default platform settings exist in the database
   */
  private async ensureDefaultSettings() {
    const count = await this.prisma.platformSettings.count();

    if (count === 0) {
      this.logger.log('Creating default platform settings...');
      await this.prisma.platformSettings.create({
        data: {
          defaultCommissionRate: new Decimal(0.10), // 10%
          premiumCommissionRate: new Decimal(0.07), // 7%
          additionalEventPrice: new Decimal(3000),
          premiumSubscriptionPrice: new Decimal(15000),
          topBannerPricePerWeek: new Decimal(15000),
          nativeFeedPricePerWeek: new Decimal(8000),
          sidebarPricePerWeek: new Decimal(5000),
        },
      });
      this.logger.log('Default platform settings created successfully');
    }
  }

  /**
   * Get current platform settings
   * Public endpoint - anyone can view settings
   */
  async getSettings() {
    let settings = await this.prisma.platformSettings.findFirst();

    // If somehow settings don't exist, create them
    if (!settings) {
      await this.ensureDefaultSettings();
      settings = await this.prisma.platformSettings.findFirst();
    }

    return settings;
  }

  /**
   * Update platform settings (ADMIN only)
   */
  async updateSettings(dto: UpdatePlatformSettingsDto, adminId: string) {
    let settings = await this.prisma.platformSettings.findFirst();

    // Convert numbers to Decimal for fields that need it
    const updateData: any = {};

    if (dto.defaultCommissionRate !== undefined) {
      updateData.defaultCommissionRate = new Decimal(dto.defaultCommissionRate);
    }
    if (dto.premiumCommissionRate !== undefined) {
      updateData.premiumCommissionRate = new Decimal(dto.premiumCommissionRate);
    }
    if (dto.additionalEventPrice !== undefined) {
      updateData.additionalEventPrice = new Decimal(dto.additionalEventPrice);
    }
    if (dto.premiumSubscriptionPrice !== undefined) {
      updateData.premiumSubscriptionPrice = new Decimal(dto.premiumSubscriptionPrice);
    }
    if (dto.topBannerPricePerWeek !== undefined) {
      updateData.topBannerPricePerWeek = new Decimal(dto.topBannerPricePerWeek);
    }
    if (dto.nativeFeedPricePerWeek !== undefined) {
      updateData.nativeFeedPricePerWeek = new Decimal(dto.nativeFeedPricePerWeek);
    }
    if (dto.sidebarPricePerWeek !== undefined) {
      updateData.sidebarPricePerWeek = new Decimal(dto.sidebarPricePerWeek);
    }
    if (dto.platformKaspiPhone !== undefined) {
      updateData.platformKaspiPhone = dto.platformKaspiPhone;
    }
    if (dto.platformKaspiName !== undefined) {
      updateData.platformKaspiName = dto.platformKaspiName;
    }

    updateData.updatedBy = adminId;

    if (!settings) {
      // Create if doesn't exist
      settings = await this.prisma.platformSettings.create({
        data: {
          ...updateData,
          defaultCommissionRate: updateData.defaultCommissionRate || new Decimal(0.10),
          premiumCommissionRate: updateData.premiumCommissionRate || new Decimal(0.07),
          additionalEventPrice: updateData.additionalEventPrice || new Decimal(3000),
          premiumSubscriptionPrice: updateData.premiumSubscriptionPrice || new Decimal(15000),
          topBannerPricePerWeek: updateData.topBannerPricePerWeek || new Decimal(15000),
          nativeFeedPricePerWeek: updateData.nativeFeedPricePerWeek || new Decimal(8000),
          sidebarPricePerWeek: updateData.sidebarPricePerWeek || new Decimal(5000),
        },
      });
    } else {
      // Update existing settings
      settings = await this.prisma.platformSettings.update({
        where: { id: settings.id },
        data: updateData,
      });
    }

    this.logger.log(`Platform settings updated by admin ${adminId}`);

    return settings;
  }
}
