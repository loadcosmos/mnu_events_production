import { api } from './apiClient.js';

/**
 * Posts Service
 * Manages community posts, likes, and comments
 */
const postsService = {
    /**
     * Get all visible posts
     * @param {Object} params - Query params (page, limit)
     */
    async getAll(params = {}) {
        return api.get('/posts', params);
    },

    /**
     * Get current user's posts (for My Posts page)
     * @param {Object} params - Query params (page, limit)
     */
    async getMyPosts(params = {}) {
        return api.get('/posts/me', params);
    },

    /**
     * Get pending posts for moderation (Moderator/Admin only)
     * @param {Object} params - Query params (page, limit)
     */
    async getPendingPosts(params = {}) {
        return api.get('/posts/moderation', params);
    },

    /**
     * Moderate a post (approve/reject)
     * @param {string} id - Post ID
     * @param {Object} data - { status: 'APPROVED' | 'REJECTED' }
     */
    async moderatePost(id, data) {
        return api.patch(`/posts/${id}/moderate`, data);
    },

    /**
     * Create a new post
     * @param {FormData} formData - Post data (content, image)
     */
    async create(formData) {
        // Note: If sending FormData (file), use proper headers
        // But currently CreatePostDto takes imageUrl string.
        // So we assume image upload is handled separately by uploadService
        // and we pass imageUrl here.
        return api.post('/posts', formData);
    },

    /**
     * Update a post
     * @param {string} id - Post ID
     * @param {Object} data - Update data
     */
    async update(id, data) {
        return api.patch(`/posts/${id}`, data);
    },

    /**
     * Delete a post
     * @param {string} id - Post ID
     */
    async delete(id) {
        return api.delete(`/posts/${id}`);
    },

    /**
     * Toggle like on a post
     * @param {string} id - Post ID
     */
    async toggleLike(id) {
        return api.post(`/posts/${id}/like`);
    },

    /**
     * Get comments for a post
     * @param {string} id - Post ID
     * @param {Object} params - Query params
     */
    async getComments(id, params = {}) {
        return api.get(`/posts/${id}/comments`, params);
    },

    /**
     * Add a comment
     * @param {string} id - Post ID
     * @param {Object} data - Comment data { content }
     */
    async addComment(id, data) {
        return api.post(`/posts/${id}/comments`, data);
    },

    /**
     * Delete a comment
     * @param {string} postId - Post ID
     * @param {string} commentId - Comment ID
     */
    async deleteComment(postId, commentId) {
        return api.delete(`/posts/${postId}/comments/${commentId}`);
    },
};

export default postsService;
