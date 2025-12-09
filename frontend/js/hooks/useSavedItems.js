import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import savedPostsService from '../services/savedPostsService';
import savedEventsService from '../services/savedEventsService';

/**
 * Query keys for saved items
 */
export const savedItemsKeys = {
    posts: ['savedPosts'],
    events: ['savedEvents'],
    postStatus: (postId) => ['savedPosts', 'status', postId],
    eventStatus: (eventId) => ['savedEvents', 'status', eventId],
};

/**
 * Get all saved posts
 * @param {Object} params - Query parameters
 */
export const useSavedPosts = (params = {}) => {
    return useQuery({
        queryKey: savedItemsKeys.posts,
        queryFn: () => savedPostsService.getAll(params),
        staleTime: 5 * 60 * 1000, // 5 minutes
        select: (data) => {
            const items = data.data || [];
            return items.map(sp => sp.post).filter(Boolean);
        }
    });
};

/**
 * Get all saved events
 * @param {Object} params - Query parameters
 */
export const useSavedEvents = (params = {}) => {
    return useQuery({
        queryKey: savedItemsKeys.events,
        queryFn: () => savedEventsService.getAll(params),
        staleTime: 5 * 60 * 1000,
        select: (data) => {
            const items = data.data || data || [];
            return items.map(se => se.event).filter(Boolean);
        }
    });
};

/**
 * Check if a post is saved
 * @param {string} postId - Post ID
 */
export const useIsPostSaved = (postId) => {
    return useQuery({
        queryKey: savedItemsKeys.postStatus(postId),
        queryFn: () => savedPostsService.checkStatus(postId),
        enabled: !!postId,
        staleTime: 5 * 60 * 1000,
        select: (data) => data.isSaved || false
    });
};

/**
 * Check if an event is saved
 * @param {string} eventId - Event ID
 */
export const useIsEventSaved = (eventId) => {
    return useQuery({
        queryKey: savedItemsKeys.eventStatus(eventId),
        queryFn: () => savedEventsService.checkStatus(eventId),
        enabled: !!eventId,
        staleTime: 5 * 60 * 1000,
        select: (data) => data.isSaved || false
    });
};

/**
 * Save a post
 */
export const useSavePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (postId) => savedPostsService.save(postId),
        onMutate: async (postId) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: savedItemsKeys.posts });
            await queryClient.cancelQueries({ queryKey: savedItemsKeys.postStatus(postId) });

            // Snapshot previous values
            const previousSavedPosts = queryClient.getQueryData(savedItemsKeys.posts);
            const previousStatus = queryClient.getQueryData(savedItemsKeys.postStatus(postId));

            // Optimistically update status
            queryClient.setQueryData(savedItemsKeys.postStatus(postId), true);

            return { previousSavedPosts, previousStatus };
        },
        onError: (err, postId, context) => {
            // Rollback on error
            if (context?.previousSavedPosts) {
                queryClient.setQueryData(savedItemsKeys.posts, context.previousSavedPosts);
            }
            if (context?.previousStatus !== undefined) {
                queryClient.setQueryData(savedItemsKeys.postStatus(postId), context.previousStatus);
            }
        },
        onSettled: (_, __, postId) => {
            // Refetch after mutation
            queryClient.invalidateQueries({ queryKey: savedItemsKeys.posts });
            queryClient.invalidateQueries({ queryKey: savedItemsKeys.postStatus(postId) });
        }
    });
};

/**
 * Unsave a post
 */
export const useUnsavePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (postId) => savedPostsService.unsave(postId),
        onMutate: async (postId) => {
            await queryClient.cancelQueries({ queryKey: savedItemsKeys.posts });
            await queryClient.cancelQueries({ queryKey: savedItemsKeys.postStatus(postId) });

            const previousSavedPosts = queryClient.getQueryData(savedItemsKeys.posts);
            const previousStatus = queryClient.getQueryData(savedItemsKeys.postStatus(postId));

            // Optimistically update
            queryClient.setQueryData(savedItemsKeys.postStatus(postId), false);
            queryClient.setQueryData(savedItemsKeys.posts, (old) => {
                if (!Array.isArray(old)) return old;
                return old.filter(post => post.id !== postId);
            });

            return { previousSavedPosts, previousStatus };
        },
        onError: (err, postId, context) => {
            if (context?.previousSavedPosts) {
                queryClient.setQueryData(savedItemsKeys.posts, context.previousSavedPosts);
            }
            if (context?.previousStatus !== undefined) {
                queryClient.setQueryData(savedItemsKeys.postStatus(postId), context.previousStatus);
            }
        },
        onSettled: (_, __, postId) => {
            queryClient.invalidateQueries({ queryKey: savedItemsKeys.posts });
            queryClient.invalidateQueries({ queryKey: savedItemsKeys.postStatus(postId) });
        }
    });
};

/**
 * Toggle save status for a post
 */
export const useToggleSavePost = () => {
    const savePost = useSavePost();
    const unsavePost = useUnsavePost();

    return {
        mutate: (postId, isSaved) => {
            if (isSaved) {
                unsavePost.mutate(postId);
            } else {
                savePost.mutate(postId);
            }
        },
        mutateAsync: async (postId, isSaved) => {
            if (isSaved) {
                return unsavePost.mutateAsync(postId);
            } else {
                return savePost.mutateAsync(postId);
            }
        },
        isLoading: savePost.isLoading || unsavePost.isLoading
    };
};

/**
 * Save an event
 */
export const useSaveEvent = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (eventId) => savedEventsService.save(eventId),
        onMutate: async (eventId) => {
            await queryClient.cancelQueries({ queryKey: savedItemsKeys.events });
            await queryClient.cancelQueries({ queryKey: savedItemsKeys.eventStatus(eventId) });

            const previousSavedEvents = queryClient.getQueryData(savedItemsKeys.events);
            const previousStatus = queryClient.getQueryData(savedItemsKeys.eventStatus(eventId));

            queryClient.setQueryData(savedItemsKeys.eventStatus(eventId), true);

            return { previousSavedEvents, previousStatus };
        },
        onError: (err, eventId, context) => {
            if (context?.previousSavedEvents) {
                queryClient.setQueryData(savedItemsKeys.events, context.previousSavedEvents);
            }
            if (context?.previousStatus !== undefined) {
                queryClient.setQueryData(savedItemsKeys.eventStatus(eventId), context.previousStatus);
            }
        },
        onSettled: (_, __, eventId) => {
            queryClient.invalidateQueries({ queryKey: savedItemsKeys.events });
            queryClient.invalidateQueries({ queryKey: savedItemsKeys.eventStatus(eventId) });
        }
    });
};

/**
 * Unsave an event
 */
export const useUnsaveEvent = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (eventId) => savedEventsService.unsave(eventId),
        onMutate: async (eventId) => {
            await queryClient.cancelQueries({ queryKey: savedItemsKeys.events });
            await queryClient.cancelQueries({ queryKey: savedItemsKeys.eventStatus(eventId) });

            const previousSavedEvents = queryClient.getQueryData(savedItemsKeys.events);
            const previousStatus = queryClient.getQueryData(savedItemsKeys.eventStatus(eventId));

            queryClient.setQueryData(savedItemsKeys.eventStatus(eventId), false);
            queryClient.setQueryData(savedItemsKeys.events, (old) => {
                if (!Array.isArray(old)) return old;
                return old.filter(event => event.id !== eventId);
            });

            return { previousSavedEvents, previousStatus };
        },
        onError: (err, eventId, context) => {
            if (context?.previousSavedEvents) {
                queryClient.setQueryData(savedItemsKeys.events, context.previousSavedEvents);
            }
            if (context?.previousStatus !== undefined) {
                queryClient.setQueryData(savedItemsKeys.eventStatus(eventId), context.previousStatus);
            }
        },
        onSettled: (_, __, eventId) => {
            queryClient.invalidateQueries({ queryKey: savedItemsKeys.events });
            queryClient.invalidateQueries({ queryKey: savedItemsKeys.eventStatus(eventId) });
        }
    });
};

/**
 * Toggle save status for an event
 */
export const useToggleSaveEvent = () => {
    const saveEvent = useSaveEvent();
    const unsaveEvent = useUnsaveEvent();

    return {
        mutate: (eventId, isSaved) => {
            if (isSaved) {
                unsaveEvent.mutate(eventId);
            } else {
                saveEvent.mutate(eventId);
            }
        },
        mutateAsync: async (eventId, isSaved) => {
            if (isSaved) {
                return unsaveEvent.mutateAsync(eventId);
            } else {
                return saveEvent.mutateAsync(eventId);
            }
        },
        isLoading: saveEvent.isLoading || unsaveEvent.isLoading
    };
};
