/**
 * React Query hooks for Clubs API
 * Provides caching, deduplication, and automatic refetching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import clubsService from '../services/clubsService';

// Query keys for cache management
export const clubKeys = {
    all: ['clubs'],
    lists: () => [...clubKeys.all, 'list'],
    list: (filters) => [...clubKeys.lists(), filters],
    details: () => [...clubKeys.all, 'detail'],
    detail: (id) => [...clubKeys.details(), id],
    myClubs: () => [...clubKeys.all, 'my-clubs'],
};

/**
 * Hook to fetch all clubs with filters
 * @param {Object} filters - Filter parameters (page, limit, category, etc.)
 * @param {Object} options - Additional React Query options
 */
export function useClubs(filters = {}, options = {}) {
    return useQuery({
        queryKey: clubKeys.list(filters),
        queryFn: async () => {
            const response = await clubsService.getAll(filters);
            // Normalize response
            if (Array.isArray(response)) return response;
            if (Array.isArray(response?.data)) return response.data;
            if (Array.isArray(response?.clubs)) return response.clubs;
            return [];
        },
        ...options,
    });
}

/**
 * Hook to fetch a single club by ID
 * @param {string} clubId - Club ID
 * @param {Object} options - Additional React Query options
 */
export function useClub(clubId, options = {}) {
    return useQuery({
        queryKey: clubKeys.detail(clubId),
        queryFn: () => clubsService.getById(clubId),
        enabled: !!clubId,
        ...options,
    });
}

/**
 * Hook to fetch current user's clubs
 * @param {Object} options - Additional React Query options
 */
export function useMyClubs(options = {}) {
    return useQuery({
        queryKey: clubKeys.myClubs(),
        queryFn: () => clubsService.getMyClubs(),
        ...options,
    });
}

/**
 * Hook to join a club
 */
export function useJoinClub() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (clubId) => clubsService.join(clubId),
        onSuccess: (_, clubId) => {
            queryClient.invalidateQueries({ queryKey: clubKeys.detail(clubId) });
            queryClient.invalidateQueries({ queryKey: clubKeys.myClubs() });
        },
    });
}

/**
 * Hook to leave a club
 */
export function useLeaveClub() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (clubId) => clubsService.leave(clubId),
        onSuccess: (_, clubId) => {
            queryClient.invalidateQueries({ queryKey: clubKeys.detail(clubId) });
            queryClient.invalidateQueries({ queryKey: clubKeys.myClubs() });
        },
    });
}
