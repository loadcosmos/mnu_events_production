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

        // Fetch details for each item
        const itemsWithDetails = await Promise.all(
            queueItems.map(async (item) => {
                let details = null;
                try {
                    switch (item.itemType) {
                        case ModerationType.SERVICE:
                            details = await this.prisma.service.findUnique({ where: { id: item.itemId } });
                            break;
                        case ModerationType.EVENT:
                            details = await this.prisma.event.findUnique({ where: { id: item.itemId } });
                            break;
                        case ModerationType.ADVERTISEMENT:
                            details = await this.prisma.advertisement.findUnique({ where: { id: item.itemId } });
                            break;
                    }
                } catch (error) {
                    this.logger.error(`Failed to fetch details for item ${item.itemId}`, error);
                }
                return { ...item, details };
            }),
        );

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
        const pending = await this.prisma.moderationQueue.count({
            where: { status: ModerationStatus.PENDING },
        });
        const approved = await this.prisma.moderationQueue.count({
            where: { status: ModerationStatus.APPROVED },
        });
        const rejected = await this.prisma.moderationQueue.count({
            where: { status: ModerationStatus.REJECTED },
        });

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
