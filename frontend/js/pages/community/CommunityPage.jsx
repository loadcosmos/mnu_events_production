import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import PostCard from '../../components/posts/PostCard';
import CreatePostModal from '../../components/posts/CreatePostModal';
import { useInfinitePosts } from '../../hooks';
import { toast } from 'sonner';

// Debounce hook for search
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
}

export default function CommunityPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('all');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [showFilters, setShowFilters] = useState(false);
    const loadMoreRef = useRef(null);

    const debouncedSearch = useDebounce(searchQuery, 300);

    // Determine type filter based on active tab
    const typeFilter = useMemo(() => {
        switch (activeTab) {
            case 'announcements':
                return ['ANNOUNCEMENT'];
            case 'faculty':
                return ['FACULTY_POST'];
            case 'students':
                return ['STUDENT_POST'];
            default:
                return undefined;
        }
    }, [activeTab]);

    // React Query infinite scroll
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        refetch
    } = useInfinitePosts({ limit: 10, type: typeFilter, search: debouncedSearch || undefined });

    // Filter and sort posts locally
    const posts = useMemo(() => {
        let result = data?.posts || [];

        // Sort posts
        if (sortBy === 'popular') {
            result = [...result].sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
        }
        // 'newest' is default from backend

        return result;
    }, [data?.posts, sortBy]);

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

                {/* Search Bar */}
                <div className="relative mb-4">
                    <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search posts..."
                        className="w-full pl-11 pr-10 py-3 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-2xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#d62e1f]/50 transition-all"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <i className="fa-solid fa-times" />
                        </button>
                    )}
                </div>

                {/* Filter Toggle & Sort */}
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                            showFilters
                                ? 'bg-[#d62e1f] text-white'
                                : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
                        }`}
                    >
                        <i className="fa-solid fa-filter text-sm" />
                        Filters
                        {activeTab !== 'all' && (
                            <span className="w-2 h-2 bg-white rounded-full" />
                        )}
                    </button>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Sort:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-3 py-2 bg-gray-100 dark:bg-white/5 border-0 rounded-xl text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#d62e1f]/50"
                        >
                            <option value="newest">Newest</option>
                            <option value="popular">Popular</option>
                        </select>
                    </div>
                </div>

                {/* Filter Tabs */}
                {showFilters && (
                    <div className="mb-6 animate-in slide-in-from-top-2 fade-in duration-200">
                        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="grid w-full grid-cols-4 rounded-2xl bg-gray-100 dark:bg-white/5 p-1">
                                <TabsTrigger value="all" className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-sm transition-all text-xs md:text-sm">
                                    All
                                </TabsTrigger>
                                <TabsTrigger value="students" className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-sm transition-all text-xs md:text-sm">
                                    Students
                                </TabsTrigger>
                                <TabsTrigger value="faculty" className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-sm transition-all text-xs md:text-sm">
                                    Faculty
                                </TabsTrigger>
                                <TabsTrigger value="announcements" className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-sm transition-all text-xs md:text-sm">
                                    News
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                )}

                {/* Active Filters Display */}
                {(activeTab !== 'all' || debouncedSearch) && (
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                        {debouncedSearch && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                                <i className="fa-solid fa-search text-xs" />
                                "{debouncedSearch}"
                                <button onClick={() => setSearchQuery('')} className="ml-1 hover:text-blue-900 dark:hover:text-blue-100">
                                    <i className="fa-solid fa-times text-xs" />
                                </button>
                            </span>
                        )}
                        {activeTab !== 'all' && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#d62e1f]/10 text-[#d62e1f] rounded-full text-sm">
                                <i className="fa-solid fa-tag text-xs" />
                                {activeTab === 'students' ? 'Student Posts' : activeTab === 'faculty' ? 'Faculty Posts' : 'Announcements'}
                                <button onClick={() => setActiveTab('all')} className="ml-1 hover:text-[#a0200f]">
                                    <i className="fa-solid fa-times text-xs" />
                                </button>
                            </span>
                        )}
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setActiveTab('all');
                                setSortBy('newest');
                            }}
                            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                            Clear all
                        </button>
                    </div>
                )}

                {/* Feed */}
                <div className="space-y-6">
                    {!isLoading && posts.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <i className={`${debouncedSearch ? 'fa-solid fa-search' : 'fa-regular fa-newspaper'} text-4xl mb-3 opacity-50`}></i>
                            <p className="mb-2">
                                {debouncedSearch
                                    ? `No posts found for "${debouncedSearch}"`
                                    : activeTab !== 'all'
                                        ? `No ${activeTab === 'students' ? 'student' : activeTab === 'faculty' ? 'faculty' : ''} posts yet`
                                        : 'No posts yet. Be the first to share something!'}
                            </p>
                            {(debouncedSearch || activeTab !== 'all') && (
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setActiveTab('all');
                                    }}
                                    className="text-[#d62e1f] hover:underline text-sm"
                                >
                                    Clear filters
                                </button>
                            )}
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
