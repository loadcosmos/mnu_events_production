import { api } from './apiClient.js';

/**
 * Events Service
 * Централизованный сервис для работы с событиями
 */
const eventsService = {
  /**
   * Получить все события
   * @param {Object} params - параметры запроса
   * @param {number} params.page - номер страницы
   * @param {number} params.limit - количество на странице
   * @param {string} params.category - категория
   * @param {string} params.search - поисковый запрос
   * @returns {Promise<Object>} - список событий
   */
  async getAll(params = {}) {
    try {
      const queryParams = new URLSearchParams();

      // page и limit передаются отдельно как query параметры
      if (params.page !== undefined) queryParams.append('page', params.page.toString());
      if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());

      // Остальные параметры фильтрации
      if (params.category) queryParams.append('category', params.category);
      if (params.search) queryParams.append('search', params.search);
      if (params.status) queryParams.append('status', params.status);
      if (params.date) queryParams.append('date', params.date);
      if (params.csiTags) queryParams.append('csiTags', params.csiTags);
      if (params.startDateFrom) queryParams.append('startDateFrom', params.startDateFrom);
      if (params.startDateTo) queryParams.append('startDateTo', params.startDateTo);
      if (params.creatorId) queryParams.append('creatorId', params.creatorId);

      const queryString = queryParams.toString();
      const url = queryString ? `/events?${queryString}` : '/events';
      const response = await api.get(url);
      return response;
    } catch (error) {
      console.error('[EventsService] Get all events failed:', error);
      throw error;
    }
  },

  /**
   * Получить событие по ID
   * @param {string} id - ID события
   * @returns {Promise<Object>} - данные события
   */
  async getById(id) {
    try {
      const response = await api.get(`/events/${id}`);
      return response;
    } catch (error) {
      console.error('[EventsService] Get event by ID failed:', error);
      throw error;
    }
  },

  /**
   * Создать событие
   * @param {Object} eventData - данные события
   * @returns {Promise<Object>} - созданное событие
   */
  async create(eventData) {
    try {
      const response = await api.post('/events', eventData);
      return response;
    } catch (error) {
      console.error('[EventsService] Create event failed:', error);
      throw error;
    }
  },

  /**
   * Обновить событие
   * @param {string} id - ID события
   * @param {Object} eventData - данные для обновления
   * @returns {Promise<Object>} - обновленное событие
   */
  async update(id, eventData) {
    try {
      const response = await api.patch(`/events/${id}`, eventData);
      return response;
    } catch (error) {
      console.error('[EventsService] Update event failed:', error);
      throw error;
    }
  },

  /**
   * Удалить событие
   * @param {string} id - ID события
   * @returns {Promise<void>}
   */
  async delete(id) {
    try {
      await api.delete(`/events/${id}`);
    } catch (error) {
      console.error('[EventsService] Delete event failed:', error);
      throw error;
    }
  },

  /**
   * Получить мои события (для организатора)
   * @param {Object} params - параметры запроса
   * @returns {Promise<Object>} - список событий
   */
  async getMyEvents(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);

      const response = await api.get(`/events/my?${queryParams.toString()}`);
      return response;
    } catch (error) {
      console.error('[EventsService] Get my events failed:', error);
      throw error;
    }
  },

  /**
   * Получить статистику события
   * @param {string} id - ID события
   * @returns {Promise<Object>} - статистика
   */
  async getStatistics(id) {
    try {
      const response = await api.get(`/events/${id}/statistics`);
      return response;
    } catch (error) {
      console.error('[EventsService] Get event statistics failed:', error);
      throw error;
    }
  },
};

export default eventsService;

