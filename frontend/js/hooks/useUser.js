/**
 * React Query hooks for User/Auth API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import authService from '../services/authService';

// Query keys for cache management
export const userKeys = {
    all: ['user'],
    current: () => [...userKeys.all, 'current'],
    profile: () => [...userKeys.all, 'profile'],
};

/**
 * Hook to fetch current user profile
 * @param {Object} options - Additional React Query options
 */
export function useCurrentUser(options = {}) {
    return useQuery({
        queryKey: userKeys.current(),
        queryFn: () => authService.getCurrentUser(),
        staleTime: 10 * 60 * 1000, // User data stays fresh for 10 minutes
        retry: false, // Don't retry if user is not authenticated
        ...options,
    });
}

/**
 * Hook to update user profile
 */
export function useUpdateProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (profileData) => authService.updateProfile(profileData),
        onSuccess: (updatedUser) => {
            // Update user cache with new data
            queryClient.setQueryData(userKeys.current(), updatedUser);
        },
    });
}

/**
 * Hook to change password
 */
export function useChangePassword() {
    return useMutation({
        mutationFn: ({ currentPassword, newPassword }) =>
            authService.changePassword(currentPassword, newPassword),
    });
}
