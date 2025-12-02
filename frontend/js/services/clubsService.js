import { api } from './apiClient.js';

/**
 * Clubs Service
 * Централизованный сервис для работы с клубами
 */
const clubsService = {
  /**
   * Получить все клубы
   * @param {Object} params - параметры запроса
   * @param {number} params.page - номер страницы
   * @param {number} params.limit - количество на странице
   * @param {string} params.category - категория
   * @param {string} params.search - поисковый запрос
   * @returns {Promise<Object>} - список клубов
   */
  async getAll(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page !== undefined) queryParams.append('page', params.page.toString());
      if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
      if (params.category) queryParams.append('category', params.category);
      if (params.search) queryParams.append('search', params.search);

      const queryString = queryParams.toString();
      const url = `/clubs${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      return response;
    } catch (error) {
      console.error('[clubsService] getAll error:', error);
      throw error;
    }
  },

  /**
   * Получить клуб по ID
   * @param {string} id - ID клуба
   * @returns {Promise<Object>} - данные клуба
   */
  async getById(id) {
    try {
      const response = await api.get(`/clubs/${id}`);
      return response;
    } catch (error) {
      console.error('[clubsService] getById error:', error);
      throw error;
    }
  },

  /**
   * Создать новый клуб (только Organizer/Admin)
   * @param {Object} clubData - данные клуба
   * @returns {Promise<Object>} - созданный клуб
   */
  async create(clubData) {
    try {
      const response = await api.post('/clubs', clubData);
      return response;
    } catch (error) {
      console.error('[clubsService] create error:', error);
      throw error;
    }
  },

  /**
   * Обновить клуб (только Organizer/Admin)
   * @param {string} id - ID клуба
   * @param {Object} clubData - обновленные данные
   * @returns {Promise<Object>} - обновленный клуб
   */
  async update(id, clubData) {
    try {
      const response = await api.patch(`/clubs/${id}`, clubData);
      return response;
    } catch (error) {
      console.error('[clubsService] update error:', error);
      throw error;
    }
  },

  /**
   * Удалить клуб (только Organizer/Admin)
   * @param {string} id - ID клуба
   * @returns {Promise<Object>} - результат удаления
   */
  async delete(id) {
    try {
      const response = await api.delete(`/clubs/${id}`);
      return response;
    } catch (error) {
      console.error('[clubsService] delete error:', error);
      throw error;
    }
  },

  /**
   * Получить мои клубы (организованные или членство)
   * @returns {Promise<Array>} - список клубов
   */
  async getMyClubs() {
    try {
      const response = await api.get('/clubs/my');
      return response;
    } catch (error) {
      console.error('[clubsService] getMyClubs error:', error);
      throw error;
    }
  },

  /**
   * Присоединиться к клубу
   * @param {string} id - ID клуба
   * @returns {Promise<Object>} - результат присоединения
   */
  async join(id) {
    try {
      const response = await api.post(`/clubs/${id}/join`);
      return response;
    } catch (error) {
      console.error('[clubsService] join error:', error);
      throw error;
    }
  },

  /**
   * Покинуть клуб
   * @param {string} id - ID клуба
   * @returns {Promise<Object>} - результат выхода
   */
  async leave(id) {
    try {
      const response = await api.post(`/clubs/${id}/leave`);
      return response;
    } catch (error) {
      console.error('[clubsService] leave error:', error);
      throw error;
    }
  },
};

export default clubsService;

