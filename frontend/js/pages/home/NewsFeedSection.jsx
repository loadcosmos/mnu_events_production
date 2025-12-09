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
                const response = await postsService.getAll({ page: 1, limit: 3 });
                if (!isCancelled) {
                    // Filter to show only ANNOUNCEMENT and FACULTY_POST
                    const newsPosts = (response.data || []).filter(
                        p => p.type === 'ANNOUNCEMENT' || p.type === 'FACULTY_POST'
                    ).slice(0, 3);
                    setPosts(newsPosts);
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
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d62e1f]" />
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
