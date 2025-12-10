import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@Injectable()
export class PreferencesService {
    constructor(
        private readonly prisma: PrismaService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { }

    /**
     * Get user preferences, create if not exists
     */
    async getByUserId(userId: string) {
        let preference = await this.prisma.userPreference.findUnique({
            where: { userId },
        });

        // Create default preferences if not exists
        if (!preference) {
            preference = await this.prisma.userPreference.create({
                data: { userId },
            });
        }

        return preference;
    }

    /**
     * Invalidate recommendations cache for a user
     * We invalidate all possible limit variants (6, 12, 50 are common values)
     */
    private async invalidateRecommendationsCache(userId: string) {
        const limits = [6, 12, 50]; // Common limit values used in frontend
        for (const limit of limits) {
            await this.cacheManager.del(`recommendations:${userId}:${limit}`);
        }
    }

    /**
     * Update user preferences
     */
    async update(userId: string, dto: UpdatePreferencesDto) {
        // Ensure preference record exists
        const existing = await this.prisma.userPreference.findUnique({
            where: { userId },
        });

        let result;
        if (!existing) {
            // Create with provided data
            result = await this.prisma.userPreference.create({
                data: {
                    userId,
                    ...dto,
                },
            });
        } else {
            // Update existing
            result = await this.prisma.userPreference.update({
                where: { userId },
                data: dto,
            });
        }

        // Invalidate recommendations cache so user gets fresh recommendations
        await this.invalidateRecommendationsCache(userId);

        return result;
    }

    /**
     * Reset preferences to defaults
     */
    async reset(userId: string) {
        const existing = await this.prisma.userPreference.findUnique({
            where: { userId },
        });

        if (!existing) {
            throw new NotFoundException('Preferences not found');
        }

        const result = await this.prisma.userPreference.update({
            where: { userId },
            data: {
                preferredCategories: [],
                preferredCsiTags: [],
                interestedClubIds: [],
                availableDays: [],
                preferredTimeSlot: null,
                onboardingCompleted: false,
                onboardingStep: 1,
            },
        });

        // Invalidate recommendations cache
        await this.invalidateRecommendationsCache(userId);

        return result;
    }

    /**
     * Mark onboarding as complete
     */
    async completeOnboarding(userId: string) {
        return this.update(userId, {
            onboardingCompleted: true,
        });
    }
}
