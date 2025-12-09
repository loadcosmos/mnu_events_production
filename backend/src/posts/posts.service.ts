import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto, UpdatePostDto, ModeratePostDto, CreateCommentDto } from './dto/posts.dto';
import { Role, PostType, PostStatus, Prisma } from '@prisma/client';

@Injectable()
export class PostsService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Get posts with visibility rules
     */
    async findAll(userId: string, userRole: Role, page = 1, limit = 20) {
        const skip = (page - 1) * limit;

        // External partners cannot see any posts
        if (userRole === Role.EXTERNAL_PARTNER) {
            return {
                data: [],
                meta: { total: 0, page, limit, totalPages: 0 },
            };
        }

        const where: Prisma.PostWhereInput = {
            status: PostStatus.APPROVED,
        };

        // Visibility rules based on requester role
        if (userRole === Role.STUDENT) {
            // Students see: Student posts, Faculty posts, Announcements
            where.OR = [
                { type: PostType.STUDENT_POST },
                { type: PostType.FACULTY_POST },
                { type: PostType.ANNOUNCEMENT },
            ];
        } else if (userRole === Role.FACULTY) {
            // Faculty sees: Faculty posts, Announcements (NOT Student posts)
            where.OR = [
                { type: PostType.FACULTY_POST },
                { type: PostType.ANNOUNCEMENT },
            ];
        }
        // Admin/Moderator sees everything (no additional filter needed)

        const [posts, total] = await Promise.all([
            this.prisma.post.findMany({
                where,
                include: {
                    author: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            avatar: true,
                            role: true,
                            position: true,
                        },
                    },
                    _count: {
                        select: { likes: true, comments: true },
                    },
                },
                orderBy: [
                    { isPinned: 'desc' },
                    { createdAt: 'desc' },
                ],
                skip,
                take: limit,
            }),
            this.prisma.post.count({ where }),
        ]);

        // Check if current user liked each post
        const postIds = posts.map(p => p.id);
        const userLikes = await this.prisma.postLike.findMany({
            where: {
                postId: { in: postIds },
                userId,
            },
            select: { postId: true },
        });
        const likedPostIds = new Set(userLikes.map(l => l.postId));

        const postsWithLikeStatus = posts.map(post => ({
            ...post,
            likesCount: post._count.likes,
            commentsCount: post._count.comments,
            isLiked: likedPostIds.has(post.id),
        }));

        return {
            data: postsWithLikeStatus,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get pending posts for moderation
     */
    async findPending(page = 1, limit = 20) {
        const skip = (page - 1) * limit;

        const [posts, total] = await Promise.all([
            this.prisma.post.findMany({
                where: { status: PostStatus.PENDING },
                include: {
                    author: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            role: true,
                        },
                    },
                },
                orderBy: { createdAt: 'asc' },
                skip,
                take: limit,
            }),
            this.prisma.post.count({ where: { status: PostStatus.PENDING } }),
        ]);

        return {
            data: posts,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get posts by author (for My Posts page)
     */
    async findByAuthor(authorId: string, page = 1, limit = 50) {
        const skip = (page - 1) * limit;

        const [posts, total] = await Promise.all([
            this.prisma.post.findMany({
                where: { authorId },
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
                    _count: {
                        select: {
                            likes: true,
                            comments: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.post.count({ where: { authorId } }),
        ]);

        return {
            data: posts,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Create a new post
     */
    async create(userId: string, userRole: Role, dto: CreatePostDto) {
        // Determine post type based on user role
        let type = dto.type || PostType.STUDENT_POST;
        let status: PostStatus = PostStatus.PENDING;

        if (userRole === Role.FACULTY) {
            type = PostType.FACULTY_POST;
            status = PostStatus.APPROVED; // Auto-approve faculty posts
        } else if (userRole === Role.ADMIN || userRole === Role.MODERATOR) {
            type = PostType.ANNOUNCEMENT;
            status = PostStatus.APPROVED; // Auto-approve admin/moderator posts
        }

        return this.prisma.post.create({
            data: {
                authorId: userId,
                content: dto.content,
                imageUrl: dto.imageUrl,
                type,
                status,
            },
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
        });
    }

    /**
     * Update a post
     */
    async update(postId: string, userId: string, userRole: Role, dto: UpdatePostDto) {
        const post = await this.prisma.post.findUnique({ where: { id: postId } });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        // Only author or admin can update
        if (post.authorId !== userId && userRole !== Role.ADMIN) {
            throw new ForbiddenException('You can only edit your own posts');
        }

        return this.prisma.post.update({
            where: { id: postId },
            data: dto,
        });
    }

    /**
     * Delete a post
     */
    async delete(postId: string, userId: string, userRole: Role) {
        const post = await this.prisma.post.findUnique({ where: { id: postId } });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        // Only author, moderator, or admin can delete
        if (post.authorId !== userId &&
            userRole !== Role.ADMIN &&
            userRole !== Role.MODERATOR) {
            throw new ForbiddenException('You cannot delete this post');
        }

        await this.prisma.post.delete({ where: { id: postId } });
        return { message: 'Post deleted' };
    }

    /**
     * Moderate a post
     */
    async moderate(postId: string, dto: ModeratePostDto) {
        const post = await this.prisma.post.findUnique({ where: { id: postId } });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        return this.prisma.post.update({
            where: { id: postId },
            data: { status: dto.status as PostStatus },
        });
    }

    /**
     * Toggle like on a post
     */
    async toggleLike(postId: string, userId: string) {
        const post = await this.prisma.post.findUnique({ where: { id: postId } });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        const existingLike = await this.prisma.postLike.findUnique({
            where: {
                postId_userId: { postId, userId },
            },
        });

        if (existingLike) {
            // Unlike
            await this.prisma.$transaction([
                this.prisma.postLike.delete({
                    where: { postId_userId: { postId, userId } },
                }),
                this.prisma.post.update({
                    where: { id: postId },
                    data: { likesCount: { decrement: 1 } },
                }),
            ]);
            return { liked: false };
        } else {
            // Like
            await this.prisma.$transaction([
                this.prisma.postLike.create({
                    data: { postId, userId },
                }),
                this.prisma.post.update({
                    where: { id: postId },
                    data: { likesCount: { increment: 1 } },
                }),
            ]);
            return { liked: true };
        }
    }

    /**
     * Get comments for a post
     */
    async getComments(postId: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;

        const [comments, total] = await Promise.all([
            this.prisma.postComment.findMany({
                where: { postId },
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
                orderBy: { createdAt: 'asc' },
                skip,
                take: limit,
            }),
            this.prisma.postComment.count({ where: { postId } }),
        ]);

        return {
            data: comments,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Add a comment
     */
    async addComment(postId: string, userId: string, dto: CreateCommentDto) {
        const post = await this.prisma.post.findUnique({ where: { id: postId } });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        const [comment] = await this.prisma.$transaction([
            this.prisma.postComment.create({
                data: {
                    postId,
                    authorId: userId,
                    content: dto.content,
                },
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
            }),
            this.prisma.post.update({
                where: { id: postId },
                data: { commentsCount: { increment: 1 } },
            }),
        ]);

        return comment;
    }

    /**
     * Delete a comment
     */
    async deleteComment(postId: string, commentId: string, userId: string, userRole: Role) {
        const comment = await this.prisma.postComment.findUnique({
            where: { id: commentId },
        });

        if (!comment) {
            throw new NotFoundException('Comment not found');
        }

        // Only author, moderator, or admin can delete
        if (comment.authorId !== userId &&
            userRole !== Role.ADMIN &&
            userRole !== Role.MODERATOR) {
            throw new ForbiddenException('You cannot delete this comment');
        }

        await this.prisma.$transaction([
            this.prisma.postComment.delete({ where: { id: commentId } }),
            this.prisma.post.update({
                where: { id: postId },
                data: { commentsCount: { decrement: 1 } },
            }),
        ]);

        return { message: 'Comment deleted' };
    }
}
