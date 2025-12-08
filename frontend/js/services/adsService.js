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

  // ============ Admin Methods ============

  /**
   * Get all advertisements (admin only)
   */
  getAll: async () => {
    try {
      const response = await api.get('/advertisements');
      return response;
    } catch (error) {
      console.error('[adsService] Failed to get all advertisements:', error);
      return [];
    }
  },

  /**
   * Update advertisement payment status (admin only)
   * @param {string} adId - Advertisement ID
   * @param {string} status - Payment status (PENDING, PAID, EXPIRED)
   */
  updatePaymentStatus: async (adId, status) => {
    const response = await api.patch(`/advertisements/${adId}/payment-status`, { status });
    return response;
  },

  /**
   * Delete advertisement (admin only)
   * @param {string} adId - Advertisement ID
   */
  delete: async (adId) => {
    const response = await api.delete(`/advertisements/${adId}`);
    return response;
  },
};

export default adsService;
