import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import followsService from '../../services/followsService';
import { toast } from 'sonner';

/**
 * FollowStats - Displays follower/following counts and follow button for a user
 */
export default function FollowStats({ userId, isOwnProfile = false }) {
    const [stats, setStats] = useState({
        followersCount: 0,
        followingCount: 0,
        isFollowing: false
    });
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(false);

    useEffect(() => {
        if (userId) {
            loadFollowStats();
        }
    }, [userId]);

    const loadFollowStats = async () => {
        try {
            setLoading(true);
            const data = await followsService.getFollowStatus(userId);
            setStats({
                followersCount: data.followersCount || 0,
                followingCount: data.followingCount || 0,
                isFollowing: data.isFollowing || false
            });
        } catch (error) {
            console.error('[FollowStats] Failed to load follow stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleFollow = async () => {
        try {
            setToggling(true);
            if (stats.isFollowing) {
                await followsService.unfollow(userId);
                setStats(prev => ({
                    ...prev,
                    isFollowing: false,
                    followersCount: Math.max(0, prev.followersCount - 1)
                }));
                toast.success('Unfollowed');
            } else {
                await followsService.follow(userId);
                setStats(prev => ({
                    ...prev,
                    isFollowing: true,
                    followersCount: prev.followersCount + 1
                }));
                toast.success('Following!');
            }
        } catch (error) {
            console.error('[FollowStats] Failed to toggle follow:', error);
            toast.error('Failed to update follow status');
        } finally {
            setToggling(false);
        }
    };

    if (loading) {
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
                    <span className="font-bold text-gray-900 dark:text-white">{stats.followersCount}</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-1">Followers</span>
                </div>
                <div className="text-center">
                    <span className="font-bold text-gray-900 dark:text-white">{stats.followingCount}</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-1">Following</span>
                </div>
            </div>

            {/* Follow Button - Only show for other users */}
            {!isOwnProfile && (
                <Button
                    onClick={handleToggleFollow}
                    disabled={toggling}
                    variant={stats.isFollowing ? 'outline' : 'default'}
                    size="sm"
                    className={`rounded-full px-4 ${stats.isFollowing
                            ? 'border-[#d62e1f] text-[#d62e1f] hover:bg-[#d62e1f] hover:text-white'
                            : 'liquid-glass-red-button text-white'
                        }`}
                >
                    {toggling ? (
                        <i className="fa-solid fa-spinner fa-spin" />
                    ) : stats.isFollowing ? (
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
