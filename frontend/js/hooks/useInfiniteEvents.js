/**
 * React Query hook for infinite scroll pagination of Events
 * Loads events in batches as user scrolls
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import eventsService from '../services/eventsService';

// Query key for cache management
export const infiniteEventKeys = {
    all: ['events', 'infinite'],
    list: (filters) => [...infiniteEventKeys.all, filters],
};

/**
 * Hook for infinite scroll pagination of events
 * @param {Object} filters - Filter parameters (category, status, search, etc.)
 * @param {Object} options - Additional React Query options
 */
export function useInfiniteEvents(filters = {}, options = {}) {
    const ITEMS_PER_PAGE = 12;

    return useInfiniteQuery({
        queryKey: infiniteEventKeys.list(filters),
        queryFn: async ({ pageParam = 1 }) => {
            const result = await eventsService.getAll({
                ...filters,
                page: pageParam,
                limit: ITEMS_PER_PAGE,
            });

            // Handle different API response formats
            let eventsData = [];
            if (result && typeof result === 'object') {
                if (Array.isArray(result)) {
                    eventsData = result;
                } else if (Array.isArray(result.data)) {
                    eventsData = result.data;
                } else if (result.events && Array.isArray(result.events)) {
                    eventsData = result.events;
                }
            }

            return {
                events: eventsData,
                nextPage: pageParam + 1,
                hasMore: eventsData.length === ITEMS_PER_PAGE,
                totalFetched: eventsData.length,
            };
        },
        getNextPageParam: (lastPage) =>
            lastPage.hasMore ? lastPage.nextPage : undefined,
        initialPageParam: 1,
        ...options,
    });
}

export default useInfiniteEvents;
