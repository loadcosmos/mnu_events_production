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
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [postType, setPostType] = useState('STUDENT_POST');
    const [isPinned, setIsPinned] = useState(false);

    // Handle cropped image selection (store locally, don't upload yet)
    const handleImageSelect = async (file) => {
        console.log('[CreatePostModal] Image selected:', file.name, file.size, 'bytes');
        setImageFile(file);
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setImagePreview(null);
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };

    // Determine allowed types based on role
    // Default is STUDENT_POST (will be handled by backend)
    // Backend automatically sets type based on role mostly, but Admin can choose ANNOUNCEMENT.

    const canMakeAnnouncement = user?.role === 'ADMIN' || user?.role === 'MODERATOR';
    const canPinPost = user?.role === 'ADMIN' || user?.role === 'MODERATOR';

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('[CreatePostModal] handleSubmit called');
        console.log('[CreatePostModal] Content:', content);
        console.log('[CreatePostModal] Has image:', !!imageFile);

        // Allow post if there's content OR an image
        if (!content.trim() && !imageFile) {
            console.log('[CreatePostModal] No content and no image, returning early');
            return;
        }

        try {
            setLoading(true);
            let imageUrl = null;

            // 1. Upload image if exists
            if (imageFile) {
                console.log('[CreatePostModal] Uploading image...');
                const uploadResponse = await uploadService.uploadImage(imageFile);
                imageUrl = uploadResponse.imageUrl;
                console.log('[CreatePostModal] Image uploaded:', imageUrl);
            }

            // 2. Create post
            const postData = {
                content,
                imageUrl,
                type: canMakeAnnouncement && postType === 'ANNOUNCEMENT' ? 'ANNOUNCEMENT' : undefined,
                isPinned: canPinPost ? isPinned : undefined
            };
            console.log('[CreatePostModal] Creating post with data:', postData);

            const result = await postsService.create(postData);
            console.log('[CreatePostModal] Post created successfully:', result);

            toast.success(user.role === 'STUDENT' ? 'Post submitted for moderation' : 'Post created successfully');
            setContent('');
            setImageFile(null);
            setImagePreview(null);
            setPostType('STUDENT_POST');
            setIsPinned(false);
            if (onPostCreated) onPostCreated();
            onClose();
        } catch (error) {
            console.error('[CreatePostModal] Failed to create post:', error);
            console.error('[CreatePostModal] Error details:', JSON.stringify(error, null, 2));
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

                    {/* Content/Description - FIRST */}
                    <div className="space-y-2">
                        <Label htmlFor="content">
                            <i className="fa-solid fa-pen-to-square mr-2 text-[#d62e1f]" />
                            Description
                        </Label>
                        <Textarea
                            id="content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="What would you like to share with the community?"
                            className="min-h-[100px] rounded-xl bg-white/50 dark:bg-black/20 border-gray-200 dark:border-white/10 focus:ring-[#d62e1f] focus:border-[#d62e1f]"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
                            <span>You can post with just an image or just text</span>
                            {content && (
                                <span className={content.length > 500 ? 'text-amber-600 font-semibold' : 'text-gray-600 dark:text-gray-400'}>
                                    {content.length} / 1000
                                </span>
                            )}
                        </p>
                    </div>

                    {/* Media Upload - SECOND (Drag & Drop) */}
                    <div className="space-y-2">
                        <Label>
                            <i className="fa-solid fa-image mr-2 text-[#d62e1f]" />
                            Add Media
                        </Label>

                        {/* Image Preview */}
                        {imagePreview ? (
                            <div className="relative rounded-xl overflow-hidden border-2 border-[#d62e1f]/30 bg-[#d62e1f]/5">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-full h-48 object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    className="absolute top-2 right-2 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors"
                                >
                                    <i className="fa-solid fa-times"></i>
                                </button>
                                <div className="absolute bottom-2 left-2 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg flex items-center gap-1">
                                    <i className="fa-solid fa-check-circle"></i>
                                    Ready to upload
                                </div>
                                {imageFile && (
                                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 text-white text-xs rounded-lg">
                                        {(imageFile.size / 1024 / 1024).toFixed(2)} MB
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="relative h-40 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 dark:border-white/20 hover:border-[#d62e1f] dark:hover:border-[#d62e1f] transition-all duration-200 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-black/20 dark:to-black/30 hover:from-red-50/50 dark:hover:from-red-950/20 group">
                                {/* Custom Minimal UI Placeholder */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <div className="w-12 h-12 rounded-full bg-white dark:bg-white/5 flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform duration-200">
                                        <i className="fa-solid fa-plus text-xl text-[#d62e1f]" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                        Click to upload or drag & drop
                                    </p>
                                </div>

                                <ImageUploadCrop
                                    onUpload={handleImageSelect}
                                    aspectRatio={16 / 9}
                                    circularCrop={false}
                                    minimal={true}
                                />
                            </div>

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
                            disabled={loading || (!content.trim() && !imageFile)}
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
