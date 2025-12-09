import { api } from './apiClient.js';

/**
 * Saved Events Service
 * Manages user's saved events
 */
const savedEventsService = {
    /**
     * Get all saved events
     * @param {Object} params - Query params (page, limit)
     */
    async getAll(params = {}) {
        return api.get('/saved-events', params);
    },

    /**
     * Check if an event is saved
     * @param {string} eventId
     */
    async checkStatus(eventId) {
        return api.get(`/saved-events/${eventId}/status`);
    },

    /**
     * Save an event
     * @param {string} eventId
     */
    async save(eventId) {
        return api.post(`/saved-events/${eventId}`);
    },

    /**
     * Unsave an event
     * @param {string} eventId
     */
    async unsave(eventId) {
        return api.delete(`/saved-events/${eventId}`);
    }
};

export default savedEventsService;
