import React, { useState, useRef, useCallback } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

/**
 * Universal Image Upload & Crop Component
 * 
 * Features:
 * - File selection with drag & drop
 * - Image cropping with aspect ratio
 * - Preview before upload
 * - Loading states
 * 
 * @param {Object} props
 * @param {string} props.currentImage - Current image URL
 * @param {Function} props.onUpload - Called with cropped file blob
 * @param {number} props.aspectRatio - Aspect ratio for crop (optional, e.g., 1 for square, 16/9 for banner)
 * @param {string} props.shape - 'circle' | 'square' | 'banner'
 * @param {number} props.maxSizeMB - Max file size in MB (default: 5)
 * @param {string} props.label - Label text
 * @param {string} props.placeholder - Placeholder text/icon when no image
 * @param {boolean} props.disabled - Disable upload
 * @param {boolean} props.loading - Show loading state
 */
export default function ImageUploadCrop({
    currentImage,
    onUpload,
    aspectRatio,
    shape = 'square',
    maxSizeMB = 5,
    label = 'Upload Image',
    placeholder,
    disabled = false,
    loading = false,
    className,
    minimal = false,
}) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState(null);
    const [showCropModal, setShowCropModal] = useState(false);
    const imgRef = useRef(null);
    const fileInputRef = useRef(null);

    // Determine aspect ratio based on shape if not explicitly set
    const getAspectRatio = () => {
        if (aspectRatio) return aspectRatio;
        switch (shape) {
            case 'circle':
            case 'square':
                return 1;
            case 'banner':
                return 16 / 9;
            default:
                return undefined; // Freeform
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            alert('Please upload a JPEG, PNG, WebP, or GIF image.');
            return;
        }

        // Validate file size
        if (file.size > maxSizeMB * 1024 * 1024) {
            alert(`File too large. Maximum size is ${maxSizeMB}MB.`);
            return;
        }

        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setShowCropModal(true);
    };

    const onImageLoad = useCallback((e) => {
        const { width, height } = e.currentTarget;
        const aspect = getAspectRatio();

        // Center crop with aspect ratio
        const cropWidth = aspect ? Math.min(width, height * aspect) : width * 0.9;
        const cropHeight = aspect ? cropWidth / aspect : height * 0.9;

        const newCrop = {
            unit: 'px',
            x: (width - cropWidth) / 2,
            y: (height - cropHeight) / 2,
            width: cropWidth,
            height: cropHeight,
        };

        setCrop(newCrop);
        setCompletedCrop(newCrop);
    }, [aspectRatio, shape]);

    const getCroppedBlob = useCallback(() => {
        return new Promise((resolve, reject) => {
            if (!imgRef.current || !completedCrop) {
                console.error('[ImageUploadCrop] Missing imgRef or completedCrop');
                reject(new Error('No image or crop area defined'));
                return;
            }

            const image = imgRef.current;
            const canvas = document.createElement('canvas');
            const scaleX = image.naturalWidth / image.width;
            const scaleY = image.naturalHeight / image.height;

            // Ensure we have valid dimensions
            const cropWidth = Math.max(1, Math.round(completedCrop.width * scaleX));
            const cropHeight = Math.max(1, Math.round(completedCrop.height * scaleY));

            canvas.width = cropWidth;
            canvas.height = cropHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                console.error('[ImageUploadCrop] Could not get canvas context');
                reject(new Error('Could not get canvas context'));
                return;
            }

            ctx.drawImage(
                image,
                completedCrop.x * scaleX,
                completedCrop.y * scaleY,
                completedCrop.width * scaleX,
                completedCrop.height * scaleY,
                0,
                0,
                cropWidth,
                cropHeight
            );

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        console.log('[ImageUploadCrop] Created blob:', blob.size, 'bytes');
                        // Create a File from the Blob
                        const fileName = selectedFile?.name || 'cropped-image.jpg';
                        const file = new File([blob], fileName.replace(/\.[^/.]+$/, '.jpg'), {
                            type: 'image/jpeg',
                        });
                        console.log('[ImageUploadCrop] Created file:', file.name, file.size, 'bytes');
                        resolve(file);
                    } else {
                        console.error('[ImageUploadCrop] canvas.toBlob returned null');
                        reject(new Error('Failed to create blob from canvas'));
                    }
                },
                'image/jpeg',
                0.9
            );
        });
    }, [completedCrop, selectedFile]);

    const handleConfirmCrop = async () => {
        try {
            console.log('[ImageUploadCrop] Starting crop...');
            const croppedFile = await getCroppedBlob();
            console.log('[ImageUploadCrop] Got cropped file:', croppedFile);
            if (croppedFile && onUpload) {
                await onUpload(croppedFile);
            }
        } catch (error) {
            console.error('[ImageUploadCrop] Crop failed:', error);
            alert('Failed to crop image. Please try again.');
        }
        handleCancelCrop();
    };

    const handleCancelCrop = () => {
        setShowCropModal(false);
        setSelectedFile(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        setCrop(undefined);
        setCompletedCrop(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const shapeClasses = {
        circle: 'rounded-full',
        square: 'rounded-lg',
        banner: 'rounded-lg aspect-video',
    };

    const sizeClasses = {
        circle: 'w-24 h-24',
        square: 'w-32 h-32',
        banner: 'w-full h-auto max-h-48',
    };

    return (
        <div className={cn('space-y-2', className)}>
            {/* Simplified drag-n-drop mode when no label provided */}
            {!label ? (
                <label
                    className={cn(
                        'cursor-pointer flex flex-col items-center justify-center w-full h-40 transition-colors',
                        disabled && 'opacity-50 cursor-not-allowed',
                        minimal && 'h-full absolute inset-0' // Fill container in minimal mode
                    )}
                >
                    {minimal ? (
                        // Minimal UI - Invisible clickable area that fills parent
                        // Parent (CreatePostModal) provides the visual styling
                        <div className="sr-only">Upload Image</div>
                    ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <i className="fa-solid fa-cloud-arrow-up text-4xl text-gray-400 dark:text-gray-600 mb-3" />
                            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                JPEG, PNG, WebP, GIF (max {maxSizeMB}MB)
                            </p>
                        </div>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleFileSelect}
                        disabled={disabled || loading}
                        className="hidden"
                    />
                </label>
            ) : (

                /* Full mode with preview and button */
                <>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white">
                        {label}
                    </label>

                    <div className="flex items-center gap-4">
                        {/* Preview */}
                        <div
                            className={cn(
                                'relative overflow-hidden bg-gray-200 dark:bg-[#2a2a2a] ring-2 ring-gray-300 dark:ring-[#3a3a3a] flex items-center justify-center',
                                shapeClasses[shape],
                                sizeClasses[shape]
                            )}
                        >
                            {currentImage ? (
                                <img
                                    src={currentImage}
                                    alt="Current"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                    }}
                                />
                            ) : placeholder ? (
                                <div className="text-gray-400 text-2xl">{placeholder}</div>
                            ) : null}

                            {loading && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                                </div>
                            )}
                        </div>

                        {/* Upload Button */}
                        <div className="flex-1">
                            <label
                                className={cn(
                                    'cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                                    'bg-gray-200 dark:bg-[#2a2a2a] hover:bg-gray-300 dark:hover:bg-[#3a3a3a]',
                                    'text-gray-900 dark:text-white',
                                    disabled && 'opacity-50 cursor-not-allowed'
                                )}
                            >
                                <i className="fa-solid fa-camera" />
                                <span>{loading ? 'Uploading...' : 'Choose Photo'}</span>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    onChange={handleFileSelect}
                                    disabled={disabled || loading}
                                    className="hidden"
                                />
                            </label>
                            <p className="text-xs text-gray-500 dark:text-[#666666] mt-2">
                                JPEG, PNG, WebP, GIF. Max {maxSizeMB}MB.
                            </p>
                        </div>
                    </div>
                </>
            )}

            {/* Crop Modal */}
            {showCropModal && previewUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#2a2a2a]">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Crop Image
                            </h3>
                            <button
                                onClick={handleCancelCrop}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
                            >
                                <i className="fa-solid fa-xmark text-xl" />
                            </button>
                        </div>

                        {/* Crop Area */}
                        <div className="p-4 flex justify-center bg-gray-100 dark:bg-[#0a0a0a]">
                            <ReactCrop
                                crop={crop}
                                onChange={(c) => setCrop(c)}
                                onComplete={(c) => setCompletedCrop(c)}
                                aspect={getAspectRatio()}
                                circularCrop={shape === 'circle'}
                            >
                                <img
                                    ref={imgRef}
                                    src={previewUrl}
                                    alt="Crop preview"
                                    onLoad={onImageLoad}
                                    className="max-h-[60vh] max-w-full"
                                />
                            </ReactCrop>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-[#2a2a2a]">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCancelCrop}
                                className="dark:border-[#3a3a3a] dark:text-white"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={handleConfirmCrop}
                                className="bg-[#d62e1f] hover:bg-[#b91c1c] text-white"
                            >
                                <i className="fa-solid fa-check mr-2" />
                                Apply
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
