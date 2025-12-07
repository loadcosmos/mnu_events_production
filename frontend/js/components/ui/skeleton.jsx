import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Skeleton - Loading placeholder with pulse animation
 * Use for content that is being loaded
 */
export function Skeleton({ className, ...props }) {
    return (
        <div
            className={cn(
                'animate-pulse rounded-md bg-gray-200 dark:bg-[#2a2a2a]',
                className
            )}
            {...props}
        />
    );
}

/**
 * SkeletonCard - Card-shaped skeleton for event/club cards
 */
export function SkeletonCard({ className }) {
    return (
        <div className={cn('bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] overflow-hidden', className)}>
            {/* Image skeleton */}
            <Skeleton className="h-48 w-full rounded-none" />

            {/* Content skeleton */}
            <div className="p-5 space-y-4">
                {/* Category badge */}
                <Skeleton className="h-6 w-20 rounded-lg" />

                {/* Date */}
                <Skeleton className="h-4 w-32" />

                {/* Title */}
                <Skeleton className="h-7 w-3/4" />

                {/* Description */}
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                </div>

                {/* Meta info */}
                <div className="pt-4 border-t border-gray-200 dark:border-[#2a2a2a] space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-24" />
                </div>
            </div>
        </div>
    );
}

/**
 * SkeletonText - Text line skeleton
 */
export function SkeletonText({ lines = 3, className }) {
    return (
        <div className={cn('space-y-2', className)}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    className={cn(
                        'h-4',
                        i === lines - 1 ? 'w-2/3' : 'w-full'
                    )}
                />
            ))}
        </div>
    );
}

/**
 * SkeletonAvatar - Circular avatar skeleton
 */
export function SkeletonAvatar({ size = 'md', className }) {
    const sizeClasses = {
        sm: 'h-8 w-8',
        md: 'h-12 w-12',
        lg: 'h-16 w-16',
        xl: 'h-24 w-24',
    };

    return (
        <Skeleton
            className={cn('rounded-full', sizeClasses[size], className)}
        />
    );
}

/**
 * SkeletonButton - Button-shaped skeleton
 */
export function SkeletonButton({ className }) {
    return <Skeleton className={cn('h-10 w-24 rounded-lg', className)} />;
}

/**
 * EventsGridSkeleton - Full skeleton grid for events page
 */
export function EventsGridSkeleton({ count = 6 }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    );
}

/**
 * ServiceCardSkeleton - Skeleton for marketplace service cards
 */
export function ServiceCardSkeleton({ className }) {
    return (
        <div className={cn('bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] p-5 space-y-4', className)}>
            {/* Provider info */}
            <div className="flex items-center gap-3">
                <SkeletonAvatar size="sm" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                </div>
            </div>

            {/* Title */}
            <Skeleton className="h-6 w-3/4" />

            {/* Description */}
            <SkeletonText lines={2} />

            {/* Price */}
            <Skeleton className="h-8 w-20" />
        </div>
    );
}

export default Skeleton;
