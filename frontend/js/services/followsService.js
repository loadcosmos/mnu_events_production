import { api } from './apiClient.js';

/**
 * Follows Service
 * Manages user follow relationships
 */
const followsService = {
    /**
     * Get user's followers
     * @param {string} userId - Target user ID
     * @param {Object} params - Query params (page, limit)
     */
    async getFollowers(userId, params = {}) {
        return api.get(`/users/${userId}/followers`, params);
    },

    /**
     * Get users that a user is following
     * @param {string} userId - Target user ID
     * @param {Object} params - Query params (page, limit)
     */
    async getFollowing(userId, params = {}) {
        return api.get(`/users/${userId}/following`, params);
    },

    /**
     * Check follow status and get counts
     * @param {string} userId - Target user ID
     * @returns {Promise<{isFollowing: boolean, followersCount: number, followingCount: number}>}
     */
    async getFollowStatus(userId) {
        return api.get(`/users/${userId}/follow-status`);
    },

    /**
     * Follow a user
     * @param {string} userId - User ID to follow
     */
    async follow(userId) {
        return api.post(`/users/${userId}/follow`);
    },

    /**
     * Unfollow a user
     * @param {string} userId - User ID to unfollow
     */
    async unfollow(userId) {
        return api.delete(`/users/${userId}/follow`);
    },
};

export default followsService;
