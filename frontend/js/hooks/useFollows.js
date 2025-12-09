import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import followsService from '../services/followsService';
import { toast } from 'sonner';

/**
 * Query key factory for follows
 */
export const followsKeys = {
    all: ['follows'],
    status: (userId) => [...followsKeys.all, 'status', userId],
    followers: (userId) => [...followsKeys.all, 'followers', userId],
    following: (userId) => [...followsKeys.all, 'following', userId],
};

/**
 * Hook to get follow status and stats for a user
 * @param {string} userId - User ID to get follow status for
 * @returns {Object} Query result with followersCount, followingCount, isFollowing
 */
export function useFollowStats(userId) {
    return useQuery({
        queryKey: followsKeys.status(userId),
        queryFn: () => followsService.getFollowStatus(userId),
        enabled: !!userId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

/**
 * Hook to get user's followers
 * @param {string} userId - User ID
 * @param {Object} params - Query params (page, limit)
 */
export function useFollowers(userId, params = {}) {
    return useQuery({
        queryKey: [...followsKeys.followers(userId), params],
        queryFn: () => followsService.getFollowers(userId, params),
        enabled: !!userId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

/**
 * Hook to get users that a user is following
 * @param {string} userId - User ID
 * @param {Object} params - Query params (page, limit)
 */
export function useFollowing(userId, params = {}) {
    return useQuery({
        queryKey: [...followsKeys.following(userId), params],
        queryFn: () => followsService.getFollowing(userId, params),
        enabled: !!userId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

/**
 * Hook to toggle follow status (follow/unfollow)
 * @param {string} userId - User ID to follow/unfollow
 * @returns {Object} Mutation object with mutate function
 */
export function useToggleFollow(userId) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ isCurrentlyFollowing }) => {
            if (isCurrentlyFollowing) {
                return followsService.unfollow(userId);
            } else {
                return followsService.follow(userId);
            }
        },
        // Optimistic update
        onMutate: async ({ isCurrentlyFollowing }) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: followsKeys.status(userId) });

            // Snapshot previous value
            const previousStats = queryClient.getQueryData(followsKeys.status(userId));

            // Optimistically update
            queryClient.setQueryData(followsKeys.status(userId), (old) => ({
                ...old,
                isFollowing: !isCurrentlyFollowing,
                followersCount: isCurrentlyFollowing
                    ? Math.max(0, (old?.followersCount || 0) - 1)
                    : (old?.followersCount || 0) + 1,
            }));

            return { previousStats };
        },
        onSuccess: (data, { isCurrentlyFollowing }) => {
            toast.success(isCurrentlyFollowing ? 'Unfollowed' : 'Following!');
        },
        onError: (error, variables, context) => {
            // Rollback on error
            queryClient.setQueryData(followsKeys.status(userId), context.previousStats);
            toast.error('Failed to update follow status');
            console.error('[useToggleFollow] Error:', error);
        },
        onSettled: () => {
            // Refetch to ensure consistency
            queryClient.invalidateQueries({ queryKey: followsKeys.status(userId) });
        },
    });
}
