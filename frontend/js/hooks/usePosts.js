import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import postsService from '../services/postsService';

/**
 * Query key factory for posts
 */
export const postsKeys = {
    all: ['posts'],
    lists: () => [...postsKeys.all, 'list'],
    list: (filters) => [...postsKeys.lists(), filters],
    my: () => [...postsKeys.all, 'my'],
    details: () => [...postsKeys.all, 'detail'],
    detail: (id) => [...postsKeys.details(), id],
    comments: (postId) => [...postsKeys.all, 'comments', postId],
};

/**
 * Get all posts with optional filters
 * @param {Object} params - Query parameters { page, limit, type }
 */
export const usePosts = (params = {}) => {
    return useQuery({
        queryKey: postsKeys.list(params),
        queryFn: () => postsService.getAll(params),
        staleTime: 5 * 60 * 1000, // 5 minutes
        select: (data) => ({
            posts: data.data || [],
            meta: data.meta || { total: 0, page: 1, limit: 20, totalPages: 0 }
        })
    });
};

/**
 * Get posts with infinite scroll
 * @param {Object} params - Base query parameters { limit, type }
 */
export const useInfinitePosts = (params = {}) => {
    return useInfiniteQuery({
        queryKey: [...postsKeys.lists(), 'infinite', params],
        queryFn: ({ pageParam = 1 }) => postsService.getAll({ ...params, page: pageParam }),
        getNextPageParam: (lastPage) => {
            const { page, totalPages } = lastPage.meta || {};
            return page < totalPages ? page + 1 : undefined;
        },
        staleTime: 5 * 60 * 1000,
        select: (data) => ({
            pages: data.pages,
            pageParams: data.pageParams,
            posts: data.pages.flatMap(page => page.data || [])
        })
    });
};

/**
 * Get current user's posts (My Posts page)
 * @param {Object} params - Query parameters { page, limit }
 */
export const useMyPosts = (params = {}) => {
    return useQuery({
        queryKey: postsKeys.my(),
        queryFn: () => postsService.getMyPosts(params),
        staleTime: 5 * 60 * 1000,
        select: (data) => {
            const allPosts = data.data || data || [];
            return {
                all: allPosts,
                published: allPosts.filter(p => p.status === 'APPROVED'),
                pending: allPosts.filter(p => p.status === 'PENDING'),
                rejected: allPosts.filter(p => p.status === 'REJECTED'),
                stats: {
                    total: allPosts.length,
                    likes: allPosts.reduce((acc, p) => acc + (p.likesCount || 0), 0),
                    comments: allPosts.reduce((acc, p) => acc + (p.commentsCount || 0), 0)
                }
            };
        }
    });
};

/**
 * Create a new post
 */
export const useCreatePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (postData) => postsService.create(postData),
        onSuccess: () => {
            // Invalidate all post queries
            queryClient.invalidateQueries({ queryKey: postsKeys.all });
        }
    });
};

/**
 * Update a post
 */
export const useUpdatePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }) => postsService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: postsKeys.all });
        }
    });
};

/**
 * Delete a post
 */
export const useDeletePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (postId) => postsService.delete(postId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: postsKeys.all });
        }
    });
};

/**
 * Toggle like on a post
 */
export const useToggleLike = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (postId) => postsService.toggleLike(postId),
        onMutate: async (postId) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: postsKeys.all });

            // Snapshot previous values
            const previousPosts = queryClient.getQueriesData({ queryKey: postsKeys.all });

            // Optimistically update
            queryClient.setQueriesData({ queryKey: postsKeys.all }, (old) => {
                if (!old?.data) return old;

                return {
                    ...old,
                    data: old.data.map(post =>
                        post.id === postId
                            ? {
                                ...post,
                                isLiked: !post.isLiked,
                                likesCount: post.isLiked
                                    ? Math.max(0, post.likesCount - 1)
                                    : post.likesCount + 1
                            }
                            : post
                    )
                };
            });

            return { previousPosts };
        },
        onError: (err, postId, context) => {
            // Rollback on error
            context?.previousPosts.forEach(([queryKey, data]) => {
                queryClient.setQueryData(queryKey, data);
            });
        },
        onSettled: () => {
            // Refetch after mutation
            queryClient.invalidateQueries({ queryKey: postsKeys.all });
        }
    });
};

/**
 * Get comments for a post
 */
export const usePostComments = (postId, params = {}) => {
    return useQuery({
        queryKey: postsKeys.comments(postId),
        queryFn: () => postsService.getComments(postId, params),
        enabled: !!postId,
        staleTime: 2 * 60 * 1000, // 2 minutes
        select: (data) => ({
            comments: data.data || [],
            meta: data.meta || {}
        })
    });
};

/**
 * Add a comment to a post
 */
export const useAddComment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ postId, content }) => postsService.addComment(postId, { content }),
        onSuccess: (_, variables) => {
            // Invalidate comments for this post
            queryClient.invalidateQueries({ queryKey: postsKeys.comments(variables.postId) });
            // Invalidate posts to update comment count
            queryClient.invalidateQueries({ queryKey: postsKeys.all });
        }
    });
};

/**
 * Delete a comment
 */
export const useDeleteComment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ postId, commentId }) => postsService.deleteComment(postId, commentId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: postsKeys.comments(variables.postId) });
            queryClient.invalidateQueries({ queryKey: postsKeys.all });
        }
    });
};
