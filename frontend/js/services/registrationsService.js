import { api } from './apiClient.js';

/**
 * Registrations Service
 * Централизованный сервис для работы с регистрациями на события
 */
const registrationsService = {
  /**
   * Зарегистрироваться на событие
   * @param {string} eventId - ID события
   * @returns {Promise<Object>} - данные регистрации
   */
  async register(eventId) {
    try {
      const response = await api.post('/registrations', { eventId });
      return response;
    } catch (error) {
      console.error('[RegistrationsService] Register failed:', error);
      throw error;
    }
  },

  /**
   * Получить мои регистрации
   * @param {Object} params - параметры запроса
   * @returns {Promise<Object>} - список регистраций
   */
  async getMyRegistrations(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append('status', params.status);

      const response = await api.get(`/registrations/my?${queryParams.toString()}`);
      return response;
    } catch (error) {
      console.error('[RegistrationsService] Get my registrations failed:', error);
      throw error;
    }
  },

  /**
   * Отменить регистрацию
   * @param {string} registrationId - ID регистрации
   * @returns {Promise<void>}
   */
  async cancel(registrationId) {
    try {
      await api.delete(`/registrations/${registrationId}`);
    } catch (error) {
      console.error('[RegistrationsService] Cancel registration failed:', error);
      throw error;
    }
  },

  /**
   * Получить регистрации на событие
   * @param {string} eventId - ID события
   * @returns {Promise<Array>} - список регистраций
   */
  async getByEvent(eventId) {
    try {
      const response = await api.get(`/registrations/event/${eventId}`);
      return response;
    } catch (error) {
      console.error('[RegistrationsService] Get registrations by event failed:', error);
      throw error;
    }
  },
};

export default registrationsService;

