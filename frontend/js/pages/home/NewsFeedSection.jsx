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

                    {/* Posts Grid Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="liquid-glass-card rounded-2xl p-4 animate-pulse">
                                {/* Author skeleton */}
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="h-8 w-8 bg-gray-200 dark:bg-[#2a2a2a] rounded-full" />
                                    <div className="flex-1">
                                        <div className="h-4 w-24 bg-gray-200 dark:bg-[#2a2a2a] rounded mb-1" />
                                        <div className="h-3 w-16 bg-gray-200 dark:bg-[#2a2a2a] rounded" />
                                    </div>
                                </div>
                                {/* Content skeleton */}
                                <div className="space-y-2 mb-3">
                                    <div className="h-3 w-full bg-gray-200 dark:bg-[#2a2a2a] rounded" />
                                    <div className="h-3 w-5/6 bg-gray-200 dark:bg-[#2a2a2a] rounded" />
                                    <div className="h-3 w-4/6 bg-gray-200 dark:bg-[#2a2a2a] rounded" />
                                </div>
                                {/* Image skeleton */}
                                <div className="h-32 bg-gray-200 dark:bg-[#2a2a2a] rounded-xl" />
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

                {/* Posts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {posts.map(post => (
                        <Link
                            key={post.id}
                            to="/community"
                            className="liquid-glass-card rounded-2xl p-4 hover:shadow-lg transition-all duration-300 block group"
                        >
                            {/* Author */}
                            <div className="flex items-center gap-3 mb-3">
                                <Avatar className="h-8 w-8">
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
                                {post.isPinned && (
                                    <Badge className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5">
                                        <i className="fa-solid fa-thumbtack mr-1 text-[10px]" />
                                        Pinned
                                    </Badge>
                                )}
                                {post.type === 'ANNOUNCEMENT' && (
                                    <Badge className="bg-red-100 text-red-800 text-xs px-2 py-0.5">
                                        <i className="fa-solid fa-bullhorn mr-1 text-[10px]" />
                                        Announcement
                                    </Badge>
                                )}
                            </div>

                            {/* Content Preview */}
                            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 mb-3 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                {post.content}
                            </p>

                            {/* Image Thumbnail */}
                            {post.imageUrl && (
                                <div className="rounded-xl overflow-hidden h-32 bg-gray-100 dark:bg-[#1a1a1a]">
                                    <img
                                        src={post.imageUrl}
                                        alt=""
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                </div>
                            )}
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
