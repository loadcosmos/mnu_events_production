import { api } from './apiClient.js';

const partnersService = {
  /**
   * Create a new external partner (Admin only)
   * @param {Object} partnerData - Partner data
   * @returns {Promise} Created partner
   */
  create: async (partnerData) => {
    const response = await api.post('/partners', partnerData);
    return response;
  },

  /**
   * Get all external partners (Admin only)
   * @returns {Promise} List of partners
   */
  findAll: async () => {
    const response = await api.get('/partners');
    return response;
  },

  /**
   * Get partner by ID (Admin only)
   * @param {string} id - Partner ID
   * @returns {Promise} Partner details
   */
  findOne: async (id) => {
    const response = await api.get(`/partners/${id}`);
    return response;
  },

  /**
   * Update partner (Admin only)
   * @param {string} id - Partner ID
   * @param {Object} partnerData - Updated partner data
   * @returns {Promise} Updated partner
   */
  update: async (id, partnerData) => {
    const response = await api.patch(`/partners/${id}`, partnerData);
    return response;
  },

  /**
   * Get current partner's profile (External Partner only)
   * @returns {Promise} Partner profile
   */
  getMyProfile: async () => {
    const response = await api.get('/partners/me');
    return response;
  },

  /**
   * Get current partner's dashboard statistics
   * @returns {Promise} Partner statistics
   */
  getMyStats: async () => {
    const response = await api.get('/partners/me/stats');
    return response;
  },

  /**
   * Check if partner can create a new event
   * @returns {Promise} Limit check result
   */
  canCreateEvent: async () => {
    const response = await api.get('/partners/me/can-create-event');
    return response;
  },

  /**
   * Update partner's commission rate (Admin only)
   * @param {string} id - Partner ID
   * @param {number} commissionRate - New commission rate (0-1)
   * @returns {Promise} Updated partner
   */
  updateCommissionRate: async (id, commissionRate) => {
    const response = await api.patch(`/partners/${id}/commission-rate`, {
      commissionRate,
    });
    return response;
  },

  /**
   * Add paid event slots to partner (Admin only)
   * @param {string} id - Partner ID
   * @param {number} slots - Number of slots to add
   * @returns {Promise} Updated partner
   */
  addPaidSlots: async (id, slots) => {
    const response = await api.post(`/partners/${id}/paid-slots`, { slots });
    return response;
  },

  /**
   * Mark commission as paid (Admin only)
   * @param {string} id - Partner ID
   * @param {string} ticketId - Ticket ID
   * @returns {Promise} Updated ticket
   */
  markCommissionPaid: async (id, ticketId) => {
    const response = await api.post(`/partners/${id}/commission-paid`, {
      ticketId,
    });
    return response;
  },
};

export default partnersService;
