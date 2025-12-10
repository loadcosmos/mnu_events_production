/**
 * React Query hooks for Events API
 * Provides caching, deduplication, and automatic refetching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import eventsService from '../services/eventsService';

// Query keys for cache management
export const eventKeys = {
    all: ['events'],
    lists: () => [...eventKeys.all, 'list'],
    list: (filters) => [...eventKeys.lists(), filters],
    details: () => [...eventKeys.all, 'detail'],
    detail: (id) => [...eventKeys.details(), id],
    myEvents: () => [...eventKeys.all, 'my-events'],
    statistics: (id) => [...eventKeys.all, 'statistics', id],
    recommended: (limit) => [...eventKeys.all, 'recommended', limit],
};

/**
 * Hook to fetch all events with filters
 * @param {Object} filters - Filter parameters (page, limit, category, etc.)
 * @param {Object} options - Additional React Query options
 */
export function useEvents(filters = {}, options = {}) {
    return useQuery({
        queryKey: eventKeys.list(filters),
        queryFn: () => eventsService.getAll(filters),
        ...options,
    });
}

/**
 * Hook to fetch a single event by ID
 * @param {string} eventId - Event ID
 * @param {Object} options - Additional React Query options
 */
export function useEvent(eventId, options = {}) {
    return useQuery({
        queryKey: eventKeys.detail(eventId),
        queryFn: () => eventsService.getEventById(eventId),
        enabled: !!eventId, // Only fetch if eventId exists
        ...options,
    });
}

/**
 * Hook to fetch current user's events (for organizers)
 * @param {Object} options - Additional React Query options
 */
export function useMyEvents(options = {}) {
    return useQuery({
        queryKey: eventKeys.myEvents(),
        queryFn: () => eventsService.getMyEvents(),
        ...options,
    });
}

/**
 * Hook to fetch event statistics
 * @param {string} eventId - Event ID
 * @param {Object} options - Additional React Query options
 */
export function useEventStatistics(eventId, options = {}) {
    return useQuery({
        queryKey: eventKeys.statistics(eventId),
        queryFn: () => eventsService.getEventStatistics(eventId),
        enabled: !!eventId,
        ...options,
    });
}

/**
 * Hook to fetch recommended events based on user preferences
 * @param {number} limit - Number of recommendations to return
 * @param {Object} options - Additional React Query options
 */
export function useRecommendedEvents(limit = 12, options = {}) {
    return useQuery({
        queryKey: eventKeys.recommended(limit),
        queryFn: () => eventsService.getRecommended(limit),
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        ...options,
    });
}

/**
 * Hook to create a new event
 */
export function useCreateEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (eventData) => eventsService.createEvent(eventData),
        onSuccess: () => {
            // Invalidate events list to refetch
            queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
            queryClient.invalidateQueries({ queryKey: eventKeys.myEvents() });
        },
    });
}

/**
 * Hook to update an event
 */
export function useUpdateEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ eventId, data }) => eventsService.updateEvent(eventId, data),
        onSuccess: (_, variables) => {
            // Invalidate specific event and lists
            queryClient.invalidateQueries({ queryKey: eventKeys.detail(variables.eventId) });
            queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
            queryClient.invalidateQueries({ queryKey: eventKeys.myEvents() });
        },
    });
}

/**
 * Hook to delete an event
 */
export function useDeleteEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (eventId) => eventsService.deleteEvent(eventId),
        onSuccess: () => {
            // Invalidate all event queries
            queryClient.invalidateQueries({ queryKey: eventKeys.all });
        },
    });
}
