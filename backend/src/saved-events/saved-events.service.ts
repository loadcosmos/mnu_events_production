import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SavedEventsService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Get user's saved events
     */
    async findByUser(userId: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;

        const [savedEvents, total] = await Promise.all([
            this.prisma.savedEvent.findMany({
                where: { userId },
                include: {
                    event: true,
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.savedEvent.count({ where: { userId } }),
        ]);

        return {
            data: savedEvents.map(se => se.event),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Check if event is saved by user
     */
    async isSaved(eventId: string, userId: string): Promise<boolean> {
        const saved = await this.prisma.savedEvent.findUnique({
            where: {
                userId_eventId: { userId, eventId },
            },
        });
        return !!saved;
    }

    /**
     * Save an event
     */
    async save(eventId: string, userId: string) {
        // Check if event exists
        const event = await this.prisma.event.findUnique({ where: { id: eventId } });
        if (!event) {
            throw new NotFoundException('Event not found');
        }

        // Check if already saved
        const existing = await this.prisma.savedEvent.findUnique({
            where: {
                userId_eventId: { userId, eventId },
            },
        });

        if (existing) {
            throw new ConflictException('Event already saved');
        }

        await this.prisma.savedEvent.create({
            data: { eventId, userId },
        });

        return { saved: true };
    }

    /**
     * Unsave an event
     */
    async unsave(eventId: string, userId: string) {
        const existing = await this.prisma.savedEvent.findUnique({
            where: {
                userId_eventId: { userId, eventId },
            },
        });

        if (!existing) {
            throw new NotFoundException('Event not saved');
        }

        await this.prisma.savedEvent.delete({
            where: {
                userId_eventId: { userId, eventId },
            },
        });

        return { saved: false };
    }
}
