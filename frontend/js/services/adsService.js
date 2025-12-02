import { api } from './apiClient.js';

/**
 * Advertisements Service
 * Handles ad retrieval and tracking
 */
const adsService = {
  /**
   * Get active advertisements by position
   * @param {string} position - Ad position (TOP_BANNER, HERO_SLIDE, NATIVE_FEED, BOTTOM_BANNER, SIDEBAR)
   */
  getActive: async (position) => {
    try {
      const response = await api.get('/advertisements/active', {
        params: { position }
      });
      return response;
    } catch (error) {
      // If advertisements endpoint doesn't exist (404) or other errors, return empty array
      // This allows the app to work without ads until backend is ready
      if (error.status === 404 || error.response?.status === 404) {
        return [];
      }
      // For other errors, also return empty array but log for debugging
      console.debug('[adsService] Advertisement endpoint not available:', error.message);
      return [];
    }
  },

  /**
   * Create a new advertisement
   * @param {Object} data - Advertisement data
   */
  create: async (data) => {
    const response = await api.post('/advertisements', data);
    return response;
  },

  /**
   * Track ad impression
   * @param {string} adId - Advertisement ID
   */
  trackImpression: async (adId) => {
    try {
      await api.post(`/advertisements/${adId}/impression`);
    } catch (error) {
      console.warn('Failed to track ad impression:', error);
      // Don't throw error - tracking failures shouldn't break the app
    }
  },

  /**
   * Track ad click
   * @param {string} adId - Advertisement ID
   */
  trackClick: async (adId) => {
    try {
      await api.post(`/advertisements/${adId}/click`);
    } catch (error) {
      console.warn('Failed to track ad click:', error);
    }
  },
};

export default adsService;
