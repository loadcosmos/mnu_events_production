import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ModerationStatus, ModerationType } from '@prisma/client';

@Injectable()
export class ModerationService {
    private readonly logger = new Logger(ModerationService.name);

    constructor(private prisma: PrismaService) { }

    async addToQueue(itemType: ModerationType, itemId: string) {
        return this.prisma.moderationQueue.create({
            data: {
                itemType,
                itemId,
                status: ModerationStatus.PENDING,
            },
        });
    }

    async getQueue(status?: ModerationStatus, type?: ModerationType) {
        const whereClause: any = {};
        if (status) {
            whereClause.status = status;
        }
        if (type) {
            whereClause.itemType = type;
        }

        const queueItems = await this.prisma.moderationQueue.findMany({
            where: whereClause,
            include: {
                moderator: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        // OPTIMIZATION: Batch fetch details instead of N+1 queries
        // Group items by type
        const serviceIds: string[] = [];
        const eventIds: string[] = [];
        const adIds: string[] = [];

        queueItems.forEach(item => {
            switch (item.itemType) {
                case ModerationType.SERVICE:
                    serviceIds.push(item.itemId);
                    break;
                case ModerationType.EVENT:
                    eventIds.push(item.itemId);
                    break;
                case ModerationType.ADVERTISEMENT:
                    adIds.push(item.itemId);
                    break;
            }
        });

        // Fetch all details in parallel (max 3 queries instead of N)
        const [services, events, ads] = await Promise.all([
            serviceIds.length > 0
                ? this.prisma.service.findMany({ where: { id: { in: serviceIds } } })
                : Promise.resolve([]),
            eventIds.length > 0
                ? this.prisma.event.findMany({ where: { id: { in: eventIds } } })
                : Promise.resolve([]),
            adIds.length > 0
                ? this.prisma.advertisement.findMany({ where: { id: { in: adIds } } })
                : Promise.resolve([]),
        ]);

        // Create lookup maps for O(1) access
        const serviceMap = new Map(services.map(s => [s.id, s]));
        const eventMap = new Map(events.map(e => [e.id, e]));
        const adMap = new Map(ads.map(a => [a.id, a]));

        // Attach details to each queue item
        const itemsWithDetails = queueItems.map(item => {
            let details = null;
            switch (item.itemType) {
                case ModerationType.SERVICE:
                    details = serviceMap.get(item.itemId) || null;
                    break;
                case ModerationType.EVENT:
                    details = eventMap.get(item.itemId) || null;
                    break;
                case ModerationType.ADVERTISEMENT:
                    details = adMap.get(item.itemId) || null;
                    break;
            }
            return { ...item, details };
        });

        return itemsWithDetails;
    }

    async approve(id: string, moderatorId: string) {
        const item = await this.prisma.moderationQueue.findUnique({
            where: { id },
        });

        if (!item) {
            throw new NotFoundException('Moderation item not found');
        }

        // Update the actual item status based on type
        await this.updateItemStatus(item.itemType, item.itemId, true);

        return this.prisma.moderationQueue.update({
            where: { id },
            data: {
                status: ModerationStatus.APPROVED,
                moderatorId,
            },
        });
    }

    async reject(id: string, moderatorId: string, reason: string) {
        const item = await this.prisma.moderationQueue.findUnique({
            where: { id },
        });

        if (!item) {
            throw new NotFoundException('Moderation item not found');
        }

        // Update the actual item status based on type
        await this.updateItemStatus(item.itemType, item.itemId, false);

        return this.prisma.moderationQueue.update({
            where: { id },
            data: {
                status: ModerationStatus.REJECTED,
                moderatorId,
                rejectionReason: reason,
            },
        });
    }

    async getStats() {
        // OPTIMIZATION: Parallel queries instead of sequential
        const [pending, approved, rejected] = await Promise.all([
            this.prisma.moderationQueue.count({
                where: { status: ModerationStatus.PENDING },
            }),
            this.prisma.moderationQueue.count({
                where: { status: ModerationStatus.APPROVED },
            }),
            this.prisma.moderationQueue.count({
                where: { status: ModerationStatus.REJECTED },
            }),
        ]);

        return { pending, approved, rejected };
    }

    private async updateItemStatus(type: ModerationType, itemId: string, isApproved: boolean) {
        // Update the status of the moderated item based on approval decision

        switch (type) {
            case ModerationType.SERVICE:
                await this.prisma.service.update({
                    where: { id: itemId },
                    data: { isActive: isApproved },
                });
                break;
            case ModerationType.ADVERTISEMENT:
                await this.prisma.advertisement.update({
                    where: { id: itemId },
                    data: { isActive: isApproved },
                });
                break;
            case ModerationType.EVENT:
                // For events, we update the status:
                // - Approved: PENDING_MODERATION → UPCOMING (ready to be published)
                // - Rejected: PENDING_MODERATION → CANCELLED
                const event = await this.prisma.event.findUnique({
                    where: { id: itemId },
                    select: { status: true },
                });

                if (event) {
                    // Only update if event is in PENDING_MODERATION status
                    if (event.status === 'PENDING_MODERATION') {
                        await this.prisma.event.update({
                            where: { id: itemId },
                            data: {
                                status: isApproved ? 'UPCOMING' : 'CANCELLED',
                            },
                        });
                    }
                }
                break;
        }
    }
}
