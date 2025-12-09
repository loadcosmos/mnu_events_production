import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import PostCard from '../../components/posts/PostCard';
import CreatePostModal from '../../components/posts/CreatePostModal';
import { useInfinitePosts } from '../../hooks';
import { toast } from 'sonner';

export default function CommunityPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('all');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const loadMoreRef = useRef(null);

    // Determine type filter based on active tab
    const typeFilter = activeTab === 'news'
        ? ['ANNOUNCEMENT', 'FACULTY_POST']
        : undefined;

    // React Query infinite scroll
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        refetch
    } = useInfinitePosts({ limit: 10, type: typeFilter });

    const posts = data?.posts || [];

    // Intersection Observer for auto-load
    useEffect(() => {
        if (!loadMoreRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(loadMoreRef.current);

        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const handlePostCreated = () => {
        refetch();
    };

    const handlePostDeleted = () => {
        refetch();
    };

    return (
        <div className="min-h-screen pb-24 pt-6">
            <div className="container mx-auto px-4 max-w-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Community</h1>
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="md:hidden rounded-full h-10 w-10 p-0 liquid-glass-red-button text-white shadow-lg"
                    >
                        <i className="fa-solid fa-plus text-lg"></i>
                    </Button>
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="hidden md:flex liquid-glass-red-button text-white rounded-xl gap-2"
                    >
                        <i className="fa-solid fa-plus"></i>
                        Create Post
                    </Button>
                </div>

                {/* Filters */}
                <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
                    <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-gray-100 dark:bg-white/5 p-1">
                        <TabsTrigger value="all" className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-sm transition-all">
                            Feed
                        </TabsTrigger>
                        <TabsTrigger value="announcements" className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-sm transition-all">
                            Announcements
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* Feed */}
                <div className="space-y-6">
                    {filteredPosts.length === 0 && !loading ? (
                        <div className="text-center py-12 text-gray-500">
                            <i className="fa-regular fa-newspaper text-4xl mb-3 opacity-50"></i>
                            <p>No posts yet. Be the first to share something!</p>
                        </div>
                    ) : (
                        posts.map(post => (
                            <PostCard
                                key={post.id}
                                post={post}
                                onDelete={handlePostDeleted}
                            />
                        ))
                    )}

                    {/* Loading indicator for initial load */}
                    {isLoading && posts.length === 0 && (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                        </div>
                    )}

                    {/* Infinite scroll trigger */}
                    {hasNextPage && (
                        <div ref={loadMoreRef} className="flex justify-center py-8">
                            {isFetchingNextPage && (
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                            )}
                        </div>
                    )}

                    {/* End of feed message */}
                    {!hasNextPage && posts.length > 0 && (
                        <div className="text-center py-8 text-gray-500 text-sm">
                            <i className="fa-solid fa-check-circle mr-2"></i>
                            You've reached the end
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Action Button (Mobile) - Fixed at bottom right above nav */}
            <button
                onClick={() => setIsCreateModalOpen(true)}
                className="md:hidden fixed bottom-24 right-4 z-40 h-14 w-14 rounded-full liquid-glass-red-button text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
                aria-label="Create Post"
            >
                <i className="fa-solid fa-pen text-xl"></i>
            </button>

            <CreatePostModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onPostCreated={handlePostCreated}
            />
        </div>
    );
}
