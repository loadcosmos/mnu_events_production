import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar.jsx';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import postsService from '../../services/postsService';
import { toast } from 'sonner';

export default function PostCard({ post, onDelete, onUpdate }) {
    const { user } = useAuth();
    const [liked, setLiked] = useState(post.isLiked);
    const [likesCount, setLikesCount] = useState(post.likesCount);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);

    const isAuthor = user?.id === post.author.id;
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'MODERATOR';
    const canDelete = isAuthor || isAdmin;

    const handleLike = async () => {
        try {
            // Optimistic update
            const newLiked = !liked;
            setLiked(newLiked);
            setLikesCount(prev => newLiked ? prev + 1 : prev - 1);

            await postsService.toggleLike(post.id);
        } catch (error) {
            // Revert on error
            setLiked(!liked);
            setLikesCount(prev => !liked ? prev + 1 : prev - 1);
            toast.error('Failed to like post');
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this post?')) return;
        try {
            await postsService.delete(post.id);
            toast.success('Post deleted');
            if (onDelete) onDelete(post.id);
        } catch (error) {
            toast.error('Failed to delete post');
        }
    };

    const loadComments = async () => {
        if (showComments && comments.length > 0) {
            setShowComments(false);
            return;
        }

        try {
            setLoadingComments(true);
            setShowComments(true);
            const response = await postsService.getComments(post.id);
            setComments(response.data || []);
        } catch (error) {
            toast.error('Failed to load comments');
        } finally {
            setLoadingComments(false);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            const response = await postsService.addComment(post.id, { content: newComment });
            setComments([...comments, response]);
            setNewComment('');
            toast.success('Comment added');
        } catch (error) {
            toast.error('Failed to add comment');
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            await postsService.deleteComment(post.id, commentId);
            setComments(comments.filter(c => c.id !== commentId));
            toast.success('Comment deleted');
        } catch (error) {
            toast.error('Failed to delete comment');
        }
    };

    const getRoleBadge = (role) => {
        switch (role) {
            case 'ADMIN': return <Badge className="bg-red-100 text-red-800">Admin</Badge>;
            case 'MODERATOR': return <Badge className="bg-green-100 text-green-800">Mod</Badge>;
            case 'FACULTY': return <Badge className="bg-teal-100 text-teal-800">Faculty</Badge>;
            default: return null;
        }
    };

    return (
        <Card className="liquid-glass-card rounded-2xl mb-4 overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-white dark:border-[#2a2a2a] shadow-sm">
                            <AvatarImage src={post.author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author.id}`} />
                            <AvatarFallback>{post.author.firstName[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    {post.author.firstName} {post.author.lastName}
                                </span>
                                {getRoleBadge(post.author.role)}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                            </p>
                        </div>
                    </div>

                    {canDelete && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleDelete}
                            className="text-gray-400 hover:text-red-500 rounded-full h-8 w-8"
                        >
                            <i className="fa-solid fa-trash-alt text-sm" />
                        </Button>
                    )}
                </div>

                {/* Content */}
                <div className="mb-4">
                    {post.type === 'ANNOUNCEMENT' && (
                        <Badge className="mb-2 bg-red-100 text-red-800 border-red-200">
                            <i className="fa-solid fa-bullhorn mr-1"></i> Announcement
                        </Badge>
                    )}
                    <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap text-sm md:text-base leading-relaxed">
                        {post.content}
                    </p>
                    {post.imageUrl && (
                        <div className="mt-3 rounded-xl overflow-hidden shadow-sm">
                            <img src={post.imageUrl} alt="Post content" className="w-full h-auto object-cover max-h-[400px]" />
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 border-t border-gray-100 dark:border-white/5 pt-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLike}
                        className={`gap-2 rounded-xl transition-colors ${liked ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
                            }`}
                    >
                        <i className={`${liked ? 'fa-solid' : 'fa-regular'} fa-heart text-lg ${liked && 'animate-pulse-custom'}`} />
                        <span className="font-medium">{likesCount}</span>
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={loadComments}
                        className="gap-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                    >
                        <i className="fa-regular fa-comment text-lg" />
                        <span className="font-medium">{comments.length > 0 ? comments.length : post.commentsCount}</span>
                    </Button>
                </div>

                {/* Comments Section */}
                {showComments && (
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5 animate-in slide-in-from-top-2 fade-in duration-200">
                        <div className="space-y-4 mb-4">
                            {loadingComments ? (
                                <div className="flex justify-center p-4">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
                                </div>
                            ) : comments.length === 0 ? (
                                <p className="text-center text-gray-500 text-sm py-2">No comments yet</p>
                            ) : (
                                comments.map(comment => (
                                    <div key={comment.id} className="flex gap-3">
                                        <Avatar className="h-8 w-8 mt-1">
                                            <AvatarImage src={comment.author.avatar} />
                                            <AvatarFallback>{comment.author.firstName[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 bg-gray-50 dark:bg-white/5 rounded-2xl rounded-tl-none p-3 relative group">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-semibold text-sm text-gray-900 dark:text-white">
                                                    {comment.author.firstName} {comment.author.lastName}
                                                </span>
                                                {(user.id === comment.author.id || isAdmin) && (
                                                    <button
                                                        onClick={() => handleDeleteComment(comment.id)}
                                                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <i className="fa-solid fa-times"></i>
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <form onSubmit={handleAddComment} className="flex gap-2">
                            <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Write a comment..."
                                className="flex-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 dark:text-white"
                            />
                            <Button
                                type="submit"
                                size="sm"
                                className="liquid-glass-red-button text-white rounded-xl"
                                disabled={!newComment.trim()}
                            >
                                <i className="fa-solid fa-paper-plane" />
                            </Button>
                        </form>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
