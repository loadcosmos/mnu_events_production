import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { useFollowers, useFollowing } from '../../hooks/useFollows';
import { Link } from 'react-router-dom';

/**
 * FollowersModal - Modal to display followers or following list
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {function} props.onClose - Close handler
 * @param {string} props.userId - User ID to fetch followers/following for
 * @param {'followers' | 'following'} props.type - Type of list to show
 */
export default function FollowersModal({ isOpen, onClose, userId, type }) {
    const { data: followersData, isLoading: loadingFollowers } = useFollowers(
        userId,
        {},
    );
    const { data: followingData, isLoading: loadingFollowing } = useFollowing(
        userId,
        {},
    );

    const isLoading = type === 'followers' ? loadingFollowers : loadingFollowing;
    const data = type === 'followers' ? followersData : followingData;
    const users = data?.data || [];
    const title = type === 'followers' ? 'Followers' : 'Following';

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px] max-h-[80vh] liquid-glass-strong border-0">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                        {title}
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4 overflow-y-auto max-h-[60vh]">
                    {isLoading ? (
                        <div className="flex flex-col gap-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center gap-3 animate-pulse">
                                    <div className="w-10 h-10 bg-gray-200 dark:bg-[#2a2a2a] rounded-full" />
                                    <div className="flex-1">
                                        <div className="h-4 w-24 bg-gray-200 dark:bg-[#2a2a2a] rounded mb-1" />
                                        <div className="h-3 w-16 bg-gray-200 dark:bg-[#2a2a2a] rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <i className="fa-regular fa-user text-4xl mb-3 opacity-50"></i>
                            <p>No {type} yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {users.map((item) => {
                                // Handle both followers (user is in item.follower) and following (user is in item.following)
                                const user = type === 'followers' ? item.follower : item.following;
                                if (!user) return null;

                                return (
                                    <Link
                                        key={user.id}
                                        to={`/users/${user.id}`}
                                        onClick={onClose}
                                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                                    >
                                        <Avatar className="h-10 w-10 border-2 border-white dark:border-[#2a2a2a]">
                                            <AvatarImage
                                                src={
                                                    user.avatar ||
                                                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`
                                                }
                                            />
                                            <AvatarFallback>
                                                {user.firstName?.[0] || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-900 dark:text-white truncate">
                                                {user.firstName} {user.lastName}
                                            </p>
                                            {user.faculty && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                    {user.faculty}
                                                </p>
                                            )}
                                        </div>
                                        <i className="fa-solid fa-chevron-right text-gray-400 text-sm" />
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="pt-2 border-t border-gray-200 dark:border-white/10">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="w-full rounded-xl"
                    >
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
