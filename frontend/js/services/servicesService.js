import { api } from './apiClient.js';

/**
 * Services (Marketplace) Service
 * Handles marketplace services and tutoring
 */
const servicesService = {
  /**
   * Get all services with filters
   * @param {Object} filters - Filter parameters
   */
  getAll: async (filters = {}) => {
    const response = await api.get('/services', { params: filters });
    return response;
  },

  /**
   * Get service by ID
   * @param {string} id - Service ID
   */
  getById: async (id) => {
    const response = await api.get(`/services/${id}`);
    return response;
  },

  /**
   * Create a new service
   * @param {Object} data - Service data
   */
  create: async (data) => {
    const response = await api.post('/services', data);
    return response;
  },

  /**
   * Update service
   * @param {string} id - Service ID
   * @param {Object} data - Updated service data
   */
  update: async (id, data) => {
    const response = await api.put(`/services/${id}`, data);
    return response;
  },

  /**
   * Delete service
   * @param {string} id - Service ID
   */
  delete: async (id) => {
    const response = await api.delete(`/services/${id}`);
    return response;
  },

  /**
   * Get current user's services
   */
  getMyServices: async () => {
    const response = await api.get('/services/my-services');
    return response;
  },

  /**
   * Get services by provider
   * @param {string} providerId - Provider user ID
   */
  getByProvider: async (providerId) => {
    const response = await api.get(`/services/provider/${providerId}`);
    return response;
  },
};

export default servicesService;
