import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';

export type CloudinaryResponse = UploadApiResponse | UploadApiErrorResponse;

@Injectable()
export class CloudinaryService {
    /**
     * Upload avatar image with auto-compression and face-detection crop
     * @param file - Multer file buffer
     * @param userId - User ID for folder organization
     * @returns Cloudinary upload response with secure URL
     */
    async uploadAvatar(
        file: Express.Multer.File,
        userId: string,
    ): Promise<CloudinaryResponse> {
        if (!file) {
            throw new BadRequestException('No file provided');
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.mimetype)) {
            throw new BadRequestException(
                'Invalid file type. Only JPEG, PNG, WebP and GIF are allowed.',
            );
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new BadRequestException('File too large. Maximum size is 5MB.');
        }

        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'mnu-events/avatars',
                    public_id: `avatar_${userId}`,
                    overwrite: true,
                    transformation: [
                        // Resize to 400x400 with face detection for cropping
                        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
                        // Auto-optimize: reduces file size by ~60-80%
                        { quality: 'auto', fetch_format: 'auto' },
                    ],
                    resource_type: 'image',
                },
                (error, result) => {
                    if (error || !result) {
                        reject(new BadRequestException('Failed to upload image to cloud storage'));
                        return;
                    }
                    resolve(result);
                },
            );

            uploadStream.end(file.buffer);
        });
    }

    /**
     * Upload post image with auto-compression
     * @param file - Multer file buffer
     * @param postId - Post ID for folder organization
     * @returns Cloudinary upload response with secure URL
     */
    async uploadPostImage(
        file: Express.Multer.File,
        postId: string,
    ): Promise<CloudinaryResponse> {
        if (!file) {
            throw new BadRequestException('No file provided');
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.mimetype)) {
            throw new BadRequestException(
                'Invalid file type. Only JPEG, PNG, WebP and GIF are allowed.',
            );
        }

        const maxSize = 10 * 1024 * 1024; // 10MB for posts
        if (file.size > maxSize) {
            throw new BadRequestException('File too large. Maximum size is 10MB.');
        }

        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'mnu-events/posts',
                    public_id: `post_${postId}_${Date.now()}`,
                    transformation: [
                        // Max width 1200px, maintain aspect ratio
                        { width: 1200, crop: 'limit' },
                        // Auto-optimize
                        { quality: 'auto', fetch_format: 'auto' },
                    ],
                    resource_type: 'image',
                },
                (error, result) => {
                    if (error || !result) {
                        reject(new BadRequestException('Failed to upload image to cloud storage'));
                        return;
                    }
                    resolve(result);
                },
            );

            uploadStream.end(file.buffer);
        });
    }

    /**
     * Delete image from Cloudinary
     * @param publicId - The public ID of the image to delete
     */
    async deleteImage(publicId: string): Promise<void> {
        try {
            await cloudinary.uploader.destroy(publicId);
        } catch (error) {
            console.error('Failed to delete image from Cloudinary:', error);
        }
    }

    /**
     * Get optimized URL for an existing image
     * @param publicId - The public ID of the image
     * @param options - Transformation options
     */
    getOptimizedUrl(
        publicId: string,
        options: { width?: number; height?: number; crop?: string } = {},
    ): string {
        return cloudinary.url(publicId, {
            secure: true,
            quality: 'auto',
            fetch_format: 'auto',
            ...options,
        });
    }
}
