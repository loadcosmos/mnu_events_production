import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SavedPostsService {
    constructor(private prisma: PrismaService) { }

    async getSavedPosts(userId: string, page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.prisma.savedPost.findMany({
                where: { userId },
                include: {
                    post: {
                        include: {
                            author: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    avatar: true,
                                    role: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.savedPost.count({ where: { userId } }),
        ]);

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async checkStatus(userId: string, postId: string) {
        const saved = await this.prisma.savedPost.findUnique({
            where: {
                userId_postId: { userId, postId },
            },
        });
        return { isSaved: !!saved };
    }

    async savePost(userId: string, postId: string) {
        // Check if post exists
        const post = await this.prisma.post.findUnique({
            where: { id: postId },
        });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        // Check if already saved
        const existing = await this.prisma.savedPost.findUnique({
            where: {
                userId_postId: { userId, postId },
            },
        });

        if (existing) {
            throw new ConflictException('Post already saved');
        }

        return this.prisma.savedPost.create({
            data: { userId, postId },
        });
    }

    async unsavePost(userId: string, postId: string) {
        const saved = await this.prisma.savedPost.findUnique({
            where: {
                userId_postId: { userId, postId },
            },
        });

        if (!saved) {
            throw new NotFoundException('Saved post not found');
        }

        return this.prisma.savedPost.delete({
            where: { id: saved.id },
        });
    }
}
