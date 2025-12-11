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
                // Limit increased to 6 to show content that will be blurred
                const response = await postsService.getAll({
                    page: 1,
                    limit: 6,
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

                    {/* Posts Feed Skeleton - Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
                        {[1, 2].map(i => (
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
                                </div>
                                {/* Image skeleton - 16:9 aspect ratio */}
                                <div className="w-full aspect-video bg-gray-200 dark:bg-[#2a2a2a] rounded-xl mb-3" />
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
                            <span className="text-[#d62e1f]">Announcements</span>
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-[#a0a0a0] mt-1">
                            Official updates and news from faculty
                        </p>
                    </div>
                    {/* Optional: We can keep the top View All or rely on the bottom button. 
                        User asked for "Show more with arrow" below. I'll keep top as refined navigation. */}
                    <Link
                        to="/community"
                        className="hidden md:flex items-center gap-2 text-[#d62e1f] font-semibold hover:underline text-sm"
                    >
                        View All
                        <i className="fa-solid fa-arrow-right text-xs" />
                    </Link>
                </div>

                {/* Posts Feed - Grid with Blur and Cutoff */}
                <div className="relative">
                    {/* Container with fixed height for "one row + peek" effect */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[500px] overflow-hidden relative pb-10">
                        {posts.map((post, index) => (
                            <Link
                                key={post.id}
                                to="/community"
                                className={`
                                    liquid-glass-card rounded-2xl p-4 hover:shadow-lg transition-all duration-300 block group h-fit
                                    ${post.type === 'FACULTY_POST' || post.type === 'ANNOUNCEMENT' ? 'border-l-4 border-[#d62e1f]' : ''}
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
                                    <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-3 leading-relaxed group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
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

                    {/* Gradient Blur Overlay + Show More Button */}
                    <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-gray-50/90 via-gray-50/60 to-transparent dark:from-[#0a0a0a]/90 dark:via-[#0a0a0a]/60 dark:to-transparent backdrop-blur-[2px] flex items-end justify-center pb-6 rounded-b-2xl transition-all duration-500">
                        <Link
                            to="/community"
                            className="group flex items-center gap-2 bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-xl shadow-lg hover:shadow-xl border border-gray-200 dark:border-[#333] px-8 py-3 rounded-full text-[#d62e1f] font-semibold transition-all transform hover:scale-105 active:scale-95 text-sm z-10"
                        >
                            Show More
                            <i className="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
