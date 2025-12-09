import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@Injectable()
export class PreferencesService {
    constructor(private readonly prisma: PrismaService) { }

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
     * Update user preferences
     */
    async update(userId: string, dto: UpdatePreferencesDto) {
        // Ensure preference record exists
        const existing = await this.prisma.userPreference.findUnique({
            where: { userId },
        });

        if (!existing) {
            // Create with provided data
            return this.prisma.userPreference.create({
                data: {
                    userId,
                    ...dto,
                },
            });
        }

        // Update existing
        return this.prisma.userPreference.update({
            where: { userId },
            data: dto,
        });
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

        return this.prisma.userPreference.update({
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
