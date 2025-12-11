import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import postsService from '../../services/postsService';
import { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';

/**
 * NewsFeedSection - Displays latest 3 faculty/announcement posts on homepage
 */
export default function NewsFeedSection() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isCancelled = false;

        const loadPosts = async () => {
            try {
                // Use backend filtering for ANNOUNCEMENT and FACULTY_POST
                const response = await postsService.getAll({
                    page: 1,
                    limit: 3,
                    type: ['ANNOUNCEMENT', 'FACULTY_POST']
                });
                if (!isCancelled) {
                    // Backend already filters and sorts (pinned first, then by date)
                    setPosts(response.data || []);
                }
            } catch (error) {
                console.error('[NewsFeedSection] Failed to load posts:', error);
            } finally {
                if (!isCancelled) setLoading(false);
            }
        };

        loadPosts();
        return () => { isCancelled = true; };
    }, []);

    if (loading) {
        return (
            <section className="py-8 px-4">
                <div className="max-w-7xl mx-auto">
                    {/* Header Skeleton */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <div className="h-8 w-48 bg-gray-200 dark:bg-[#1a1a1a] rounded-lg animate-pulse mb-2" />
                            <div className="h-4 w-64 bg-gray-200 dark:bg-[#1a1a1a] rounded animate-pulse" />
                        </div>
                        <div className="h-6 w-20 bg-gray-200 dark:bg-[#1a1a1a] rounded animate-pulse" />
                    </div>

                    {/* Posts Feed Skeleton - Horizontal Cards */}
                    <div className="space-y-4 max-w-3xl mx-auto">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="liquid-glass-card rounded-2xl p-4 animate-pulse">
                                {/* Badge skeleton */}
                                <div className="h-6 w-24 bg-gray-200 dark:bg-[#2a2a2a] rounded mb-3" />
                                {/* Author skeleton */}
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="h-10 w-10 bg-gray-200 dark:bg-[#2a2a2a] rounded-full" />
                                    <div className="flex-1">
                                        <div className="h-4 w-32 bg-gray-200 dark:bg-[#2a2a2a] rounded mb-1.5" />
                                        <div className="h-3 w-20 bg-gray-200 dark:bg-[#2a2a2a] rounded" />
                                    </div>
                                </div>
                                {/* Content skeleton */}
                                <div className="space-y-2 mb-3">
                                    <div className="h-3 w-full bg-gray-200 dark:bg-[#2a2a2a] rounded" />
                                    <div className="h-3 w-11/12 bg-gray-200 dark:bg-[#2a2a2a] rounded" />
                                    <div className="h-3 w-5/6 bg-gray-200 dark:bg-[#2a2a2a] rounded" />
                                </div>
                                {/* Image skeleton - 16:9 aspect ratio */}
                                <div className="w-full aspect-video bg-gray-200 dark:bg-[#2a2a2a] rounded-xl mb-3" />
                                {/* Actions skeleton */}
                                <div className="flex items-center gap-4">
                                    <div className="h-4 w-12 bg-gray-200 dark:bg-[#2a2a2a] rounded" />
                                    <div className="h-4 w-12 bg-gray-200 dark:bg-[#2a2a2a] rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (posts.length === 0) {
        return null; // Don't show section if no posts
    }

    return (
        <section className="py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">
                            Latest <span className="text-[#d62e1f]">News</span>
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-[#a0a0a0] mt-1">
                            Announcements and updates from faculty
                        </p>
                    </div>
                    <Link
                        to="/community"
                        className="flex items-center gap-2 text-[#d62e1f] font-semibold hover:underline text-sm"
                    >
                        View All
                        <i className="fa-solid fa-arrow-right text-xs" />
                    </Link>
                </div>

                {/* Posts Feed - Horizontal Cards */}
                <div className="space-y-0 max-w-3xl mx-auto">
                    {posts.map((post, index) => (
                        <Link
                            key={post.id}
                            to="/community"
                            className={`
                                liquid-glass-card rounded-2xl p-4 hover:shadow-lg transition-all duration-300 block group
                                ${post.type === 'FACULTY_POST' || post.type === 'ANNOUNCEMENT' ? 'border-l-4 border-[#d62e1f]' : ''}
                                ${index < posts.length - 1 ? 'mb-4' : ''}
                            `}
                        >
                            {/* OFFICIAL Badge for FACULTY posts */}
                            {(post.type === 'FACULTY_POST' || post.type === 'ANNOUNCEMENT') && (
                                <div className="mb-2">
                                    <Badge className="bg-[#d62e1f] text-white px-3 py-1">
                                        <i className="fa-solid fa-graduation-cap mr-1.5 text-xs" />
                                        OFFICIAL
                                    </Badge>
                                </div>
                            )}

                            {/* Header - Author + Time + Pin */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <Avatar className="h-10 w-10 border-2 border-white dark:border-[#2a2a2a] shadow-sm">
                                        <AvatarImage src={post.author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author.id}`} />
                                        <AvatarFallback>{post.author.firstName?.[0] || '?'}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                            {post.author.firstName} {post.author.lastName}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                                {post.isPinned && (
                                    <Badge className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 ml-2 shrink-0">
                                        <i className="fa-solid fa-thumbtack mr-1 text-[10px]" />
                                        Pinned
                                    </Badge>
                                )}
                            </div>

                            {/* Content */}
                            <div className="mb-3">
                                <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-4 leading-relaxed group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                    {post.content}
                                </p>
                            </div>

                            {/* Image - 16:9 aspect ratio */}
                            {post.imageUrl && (
                                <div className="rounded-xl overflow-hidden bg-gray-100 dark:bg-[#1a1a1a] mb-3">
                                    <img
                                        src={post.imageUrl}
                                        alt=""
                                        className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                </div>
                            )}

                            {/* Actions - Likes + Comments */}
                            <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400 text-sm">
                                <div className="flex items-center gap-1.5">
                                    <i className="fa-regular fa-heart text-base" />
                                    <span className="font-medium">{post.likesCount || 0}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <i className="fa-regular fa-comment text-base" />
                                    <span className="font-medium">{post.commentsCount || 0}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
