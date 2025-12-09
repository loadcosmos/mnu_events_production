import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import PostCard from '../../components/posts/PostCard';
import CreatePostModal from '../../components/posts/CreatePostModal';
import postsService from '../../services/postsService';
import { toast } from 'sonner';

export default function CommunityPage() {
    const { user } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // Initial load
    useEffect(() => {
        loadPosts(true);
    }, []);

    const loadPosts = async (reset = false) => {
        try {
            setLoading(true);
            const currentPage = reset ? 1 : page;
            const response = await postsService.getAll({
                page: currentPage,
                limit: 10
            });

            const newPosts = response.data || [];

            if (reset) {
                setPosts(newPosts);
                setPage(2);
            } else {
                setPosts(prev => [...prev, ...newPosts]);
                setPage(prev => prev + 1);
            }

            setHasMore(newPosts.length === 10);
        } catch (error) {
            console.error('Failed to load posts:', error);
            toast.error('Failed to load feed');
        } finally {
            setLoading(false);
        }
    };

    const handlePostCreated = () => {
        loadPosts(true);
    };

    const handlePostDeleted = (deletedId) => {
        setPosts(posts.filter(p => p.id !== deletedId));
    };

    const filteredPosts = activeTab === 'all'
        ? posts
        : posts.filter(p => p.type === 'ANNOUNCEMENT' || p.type === 'FACULTY_POST');

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
                        filteredPosts.map(post => (
                            <PostCard
                                key={post.id}
                                post={post}
                                onDelete={handlePostDeleted}
                            />
                        ))
                    )}

                    {loading && (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                        </div>
                    )}

                    {!loading && hasMore && filteredPosts.length > 0 && (
                        <div className="flex justify-center pb-8">
                            <Button variant="outline" onClick={() => loadPosts(false)} className="rounded-xl">
                                Load More
                            </Button>
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
