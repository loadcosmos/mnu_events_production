import { api } from './apiClient.js';

/**
 * Preferences Service
 * Manages user preferences and interests
 */
const preferencesService = {
    /**
     * Get current user's preferences
     * @returns {Promise<Object>} User preferences
     */
    async getMyPreferences() {
        return api.get('/preferences/me');
    },

    /**
     * Update current user's preferences
     * @param {Object} data - Preferences data
     * @returns {Promise<Object>} Updated preferences
     */
    async updateMyPreferences(data) {
        return api.patch('/preferences/me', data);
    },

    /**
     * Reset preferences to defaults
     * @returns {Promise<Object>} Reset preferences
     */
    async resetMyPreferences() {
        return api.delete('/preferences/me');
    },

    /**
     * Mark onboarding as complete
     * @returns {Promise<Object>} Updated preferences
     */
    async completeOnboarding() {
        return api.patch('/preferences/me/complete-onboarding');
    },
};

export default preferencesService;
