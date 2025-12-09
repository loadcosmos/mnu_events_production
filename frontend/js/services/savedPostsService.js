import { api } from './apiClient.js';

/**
 * Saved Posts Service
 * Manages user's saved posts
 */
const savedPostsService = {
    /**
     * Get all saved posts
     * @param {Object} params - Query params (page, limit)
     */
    async getAll(params = {}) {
        return api.get('/saved-posts', params);
    },

    /**
     * Check if a post is saved
     * @param {string} postId
     */
    async checkStatus(postId) {
        return api.get(`/saved-posts/${postId}/status`);
    },

    /**
     * Save a post
     * @param {string} postId
     */
    async save(postId) {
        return api.post(`/saved-posts/${postId}`);
    },

    /**
     * Unsave a post
     * @param {string} postId
     */
    async unsave(postId) {
        return api.delete(`/saved-posts/${postId}`);
    }
};

export default savedPostsService;
