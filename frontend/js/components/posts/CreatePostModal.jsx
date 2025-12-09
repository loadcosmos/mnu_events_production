import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { useAuth } from '../../context/AuthContext';
import postsService from '../../services/postsService';
import uploadService from '../../services/uploadService';
import ImageUploadCrop from '../ImageUploadCrop';
import { toast } from 'sonner';

export default function CreatePostModal({ isOpen, onClose, onPostCreated }) {
    const { user } = useAuth();
    const [content, setContent] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [postType, setPostType] = useState('STUDENT_POST');
    const [isPinned, setIsPinned] = useState(false);

    // Determine allowed types based on role
    // Default is STUDENT_POST (will be handled by backend)
    // Backend automatically sets type based on role mostly, but Admin can choose ANNOUNCEMENT.

    const canMakeAnnouncement = user?.role === 'ADMIN' || user?.role === 'MODERATOR';
    const canPinPost = user?.role === 'ADMIN' || user?.role === 'MODERATOR';

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;

        try {
            setLoading(true);
            let imageUrl = null;

            // 1. Upload image if exists
            if (imageFile) {
                // Use generic image upload for posts
                const uploadResponse = await uploadService.uploadImage(imageFile);
                imageUrl = uploadResponse.imageUrl;
            }

            // 2. Create post
            const postData = {
                content,
                imageUrl,
                type: canMakeAnnouncement && postType === 'ANNOUNCEMENT' ? 'ANNOUNCEMENT' : undefined,
                isPinned: canPinPost ? isPinned : undefined
            };

            await postsService.create(postData);

            toast.success(user.role === 'STUDENT' ? 'Post submitted for moderation' : 'Post created successfully');
            setContent('');
            setImageFile(null);
            setPostType('STUDENT_POST');
            setIsPinned(false);
            if (onPostCreated) onPostCreated();
            onClose();
        } catch (error) {
            console.error('Failed to create post:', error);
            toast.error(error.message || 'Failed to create post');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] liquid-glass-strong border-0">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">Create New Post</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    {canMakeAnnouncement && (
                        <div className="flex gap-4 mb-4">
                            <Button
                                type="button"
                                variant={postType === 'STUDENT_POST' ? 'default' : 'outline'}
                                onClick={() => setPostType('STUDENT_POST')}
                                className="flex-1 rounded-xl"
                            >
                                Regular Post
                            </Button>
                            <Button
                                type="button"
                                variant={postType === 'ANNOUNCEMENT' ? 'default' : 'outline'}
                                onClick={() => setPostType('ANNOUNCEMENT')}
                                className={`flex-1 rounded-xl ${postType === 'ANNOUNCEMENT' ? 'bg-red-600 text-white hover:bg-red-700' : ''}`}
                            >
                                Announcement
                            </Button>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="content">What's on your mind?</Label>
                        <Textarea
                            id="content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Share something with the community..."
                            className="min-h-[120px] rounded-xl bg-white/50 dark:bg-black/20 border-gray-200 dark:border-white/10"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Add Image (Optional)</Label>
                        <div className="bg-white/50 dark:bg-black/20 rounded-xl overflow-hidden border border-gray-200 dark:border-white/10">
                            <ImageUploadCrop
                                onUpload={(file) => setImageFile(file)}
                                aspectRatio={16 / 9}
                                circularCrop={false}
                            />
                        </div>
                        {imageFile && (
                            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                                <i className="fa-solid fa-check-circle mr-1"></i> Image selected
                            </p>
                        )}
                    </div>

                    {/* Pin option for Admin/Moderator */}
                    {canPinPost && (
                        <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                            <input
                                type="checkbox"
                                id="isPinned"
                                checked={isPinned}
                                onChange={(e) => setIsPinned(e.target.checked)}
                                className="w-5 h-5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                            />
                            <label htmlFor="isPinned" className="flex items-center gap-2 cursor-pointer">
                                <i className="fa-solid fa-thumbtack text-amber-600" />
                                <span className="text-amber-800 dark:text-amber-200 font-medium">Pin this post</span>
                            </label>
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl">
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || !content.trim()}
                            className="liquid-glass-red-button text-white rounded-xl"
                        >
                            {loading ? (
                                <>
                                    <i className="fa-solid fa-spinner fa-spin mr-2" />
                                    Posting...
                                </>
                            ) : (
                                'Post'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
