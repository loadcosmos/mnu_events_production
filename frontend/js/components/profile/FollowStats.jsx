import React from 'react';
import { Button } from '../ui/button';
import { useFollowStats, useToggleFollow } from '../../hooks/useFollows';

/**
 * FollowStats - Displays follower/following counts and follow button for a user
 */
export default function FollowStats({ userId, isOwnProfile = false }) {
    const { data: stats, isLoading } = useFollowStats(userId);
    const toggleFollowMutation = useToggleFollow(userId);

    const handleToggleFollow = () => {
        toggleFollowMutation.mutate({
            isCurrentlyFollowing: stats?.isFollowing || false,
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center gap-4 animate-pulse">
                <div className="h-5 w-20 bg-gray-200 dark:bg-[#2a2a2a] rounded" />
                <div className="h-5 w-20 bg-gray-200 dark:bg-[#2a2a2a] rounded" />
            </div>
        );
    }

    return (
        <div className="flex items-center gap-4">
            {/* Stats */}
            <div className="flex items-center gap-4 text-sm">
                <div className="text-center">
                    <span className="font-bold text-gray-900 dark:text-white">
                        {stats?.followersCount || 0}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 ml-1">Followers</span>
                </div>
                <div className="text-center">
                    <span className="font-bold text-gray-900 dark:text-white">
                        {stats?.followingCount || 0}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 ml-1">Following</span>
                </div>
            </div>

            {/* Follow Button - Only show for other users */}
            {!isOwnProfile && (
                <Button
                    onClick={handleToggleFollow}
                    disabled={toggleFollowMutation.isPending}
                    variant={stats?.isFollowing ? 'outline' : 'default'}
                    size="sm"
                    className={`rounded-full px-4 ${
                        stats?.isFollowing
                            ? 'border-[#d62e1f] text-[#d62e1f] hover:bg-[#d62e1f] hover:text-white'
                            : 'liquid-glass-red-button text-white'
                    }`}
                >
                    {toggleFollowMutation.isPending ? (
                        <i className="fa-solid fa-spinner fa-spin" />
                    ) : stats?.isFollowing ? (
                        <>
                            <i className="fa-solid fa-check mr-1" />
                            Following
                        </>
                    ) : (
                        <>
                            <i className="fa-solid fa-plus mr-1" />
                            Follow
                        </>
                    )}
                </Button>
            )}
        </div>
    );
}
