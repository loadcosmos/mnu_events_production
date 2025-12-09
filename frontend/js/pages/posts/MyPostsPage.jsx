import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMyPosts, useDeletePost } from '../../hooks';
import PostCard from '../../components/posts/PostCard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { toast } from 'sonner';

/**
 * MyPostsPage - View and manage user's own posts
 */
export default function MyPostsPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('published');

    // React Query hooks
    const { data, isLoading: loading, refetch } = useMyPosts();
    const deletePostMutation = useDeletePost();

    // Extract data from React Query result
    const posts = {
        published: data?.published || [],
        pending: data?.pending || [],
        rejected: data?.rejected || []
    };
    const stats = data?.stats || { total: 0, likes: 0, comments: 0 };

    const handleDeletePost = async (postId) => {
        if (!confirm('Are you sure you want to delete this post?')) return;

        try {
            await deletePostMutation.mutateAsync(postId);
            toast.success('Post deleted');
        } catch (error) {
            toast.error('Failed to delete post');
        }
    };

    const renderPostList = (postList, emptyMessage) => {
        if (loading) {
            return (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#d62e1f]" />
                </div>
            );
        }

        if (postList.length === 0) {
            return (
                <div className="text-center py-12">
                    <i className="fa-regular fa-newspaper text-5xl text-gray-400 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Posts</h3>
                    <p className="text-gray-600 dark:text-[#a0a0a0]">{emptyMessage}</p>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {postList.map(post => (
                    <div key={post.id} className="relative">
                        <PostCard
                            post={post}
                            showActions={true}
                            onDelete={() => handleDeletePost(post.id)}
                        />
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] pb-24 md:pb-8 transition-colors duration-300">
            {/* Header */}
            <div className="bg-gradient-to-b from-gray-200 via-gray-100 to-gray-50 dark:from-[#1a1a1a] dark:via-[#0f0f0f] dark:to-[#0a0a0a] py-6 px-4 border-b border-gray-200 dark:border-[#2a2a2a]">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-4 mb-6">
                        <Link to="/profile" className="text-gray-600 dark:text-gray-400 hover:text-[#d62e1f]">
                            <i className="fa-solid fa-arrow-left text-xl" />
                        </Link>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">
                            My <span className="text-[#d62e1f]">Posts</span>
                        </h1>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-4 text-center border border-gray-200 dark:border-[#2a2a2a]">
                            <div className="text-2xl font-bold text-[#d62e1f]">{stats.total}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Posts</div>
                        </div>
                        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-4 text-center border border-gray-200 dark:border-[#2a2a2a]">
                            <div className="text-2xl font-bold text-[#d62e1f]">{stats.likes}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Likes</div>
                        </div>
                        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-4 text-center border border-gray-200 dark:border-[#2a2a2a]">
                            <div className="text-2xl font-bold text-[#d62e1f]">{stats.comments}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Comments</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 py-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-gray-100 dark:bg-white/5 p-1 mb-6">
                        <TabsTrigger
                            value="published"
                            className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-[#1a1a1a] data-[state=active]:shadow-sm transition-all text-sm"
                        >
                            Published ({posts.published.length})
                        </TabsTrigger>
                        <TabsTrigger
                            value="pending"
                            className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-[#1a1a1a] data-[state=active]:shadow-sm transition-all text-sm"
                        >
                            Pending ({posts.pending.length})
                        </TabsTrigger>
                        <TabsTrigger
                            value="rejected"
                            className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-[#1a1a1a] data-[state=active]:shadow-sm transition-all text-sm"
                        >
                            Rejected ({posts.rejected.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="published">
                        {renderPostList(posts.published, 'No published posts yet')}
                    </TabsContent>

                    <TabsContent value="pending">
                        {renderPostList(posts.pending, 'No posts awaiting moderation')}
                    </TabsContent>

                    <TabsContent value="rejected">
                        {renderPostList(posts.rejected, 'No rejected posts')}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
