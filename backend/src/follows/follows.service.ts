import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FollowsService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Get user's followers
     */
    async getFollowers(userId: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;

        const [followers, total] = await Promise.all([
            this.prisma.userFollow.findMany({
                where: { followingId: userId },
                include: {
                    follower: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            avatar: true,
                            role: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.userFollow.count({ where: { followingId: userId } }),
        ]);

        return {
            data: followers.map(f => f.follower),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get users that user is following
     */
    async getFollowing(userId: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;

        const [following, total] = await Promise.all([
            this.prisma.userFollow.findMany({
                where: { followerId: userId },
                include: {
                    following: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            avatar: true,
                            role: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.userFollow.count({ where: { followerId: userId } }),
        ]);

        return {
            data: following.map(f => f.following),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Check if current user follows target user
     */
    async isFollowing(followerId: string, followingId: string): Promise<boolean> {
        const follow = await this.prisma.userFollow.findUnique({
            where: {
                followerId_followingId: { followerId, followingId },
            },
        });
        return !!follow;
    }

    /**
     * Get follow counts for a user
     */
    async getCounts(userId: string) {
        const [followersCount, followingCount] = await Promise.all([
            this.prisma.userFollow.count({ where: { followingId: userId } }),
            this.prisma.userFollow.count({ where: { followerId: userId } }),
        ]);

        return { followersCount, followingCount };
    }

    /**
     * Follow a user
     */
    async follow(followerId: string, followingId: string) {
        if (followerId === followingId) {
            throw new BadRequestException('You cannot follow yourself');
        }

        // Check if target user exists
        const targetUser = await this.prisma.user.findUnique({ where: { id: followingId } });
        if (!targetUser) {
            throw new NotFoundException('User not found');
        }

        // Check if already following
        const existing = await this.prisma.userFollow.findUnique({
            where: {
                followerId_followingId: { followerId, followingId },
            },
        });

        if (existing) {
            throw new ConflictException('Already following this user');
        }

        await this.prisma.userFollow.create({
            data: { followerId, followingId },
        });

        return { following: true };
    }

    /**
     * Unfollow a user
     */
    async unfollow(followerId: string, followingId: string) {
        const existing = await this.prisma.userFollow.findUnique({
            where: {
                followerId_followingId: { followerId, followingId },
            },
        });

        if (!existing) {
            throw new NotFoundException('Not following this user');
        }

        await this.prisma.userFollow.delete({
            where: {
                followerId_followingId: { followerId, followingId },
            },
        });

        return { following: false };
    }
}
