import { api } from './apiClient.js';

/**
 * Users Service
 * Централизованный сервис для работы с пользователями
 */
const usersService = {
  /**
   * Получить пользователя по ID
   * @param {string} id - ID пользователя
   * @returns {Promise<Object>} - данные пользователя
   */
  async getById(id) {
    try {
      const response = await api.get(`/users/${id}`);
      return response;
    } catch (error) {
      console.error('[UsersService] Get user by ID failed:', error);
      throw error;
    }
  },

  /**
   * Обновить профиль пользователя
   * @param {string} id - ID пользователя
   * @param {Object} userData - данные для обновления
   * @returns {Promise<Object>} - обновленный пользователь
   */
  async update(id, userData) {
    try {
      const response = await api.patch(`/users/${id}`, userData);
      return response;
    } catch (error) {
      console.error('[UsersService] Update user failed:', error);
      throw error;
    }
  },

  /**
   * Получить всех пользователей (только для админов)
   * @param {Object} params - параметры запроса
   * @param {number} params.page - номер страницы
   * @param {number} params.limit - количество на странице
   * @param {string} params.search - поисковый запрос
   * @returns {Promise<Object>} - список пользователей
   */
  async getAll(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.page !== undefined) queryParams.append('page', params.page.toString());
      if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
      if (params.search) queryParams.append('search', params.search);

      const queryString = queryParams.toString();
      const url = queryString ? `/users?${queryString}` : '/users';
      const response = await api.get(url);
      return response;
    } catch (error) {
      console.error('[UsersService] Get all users failed:', error);
      throw error;
    }
  },

  /**
   * Изменить роль пользователя (только для админов)
   * @param {string} id - ID пользователя
   * @param {Object} roleData - данные роли { role: 'STUDENT' | 'ORGANIZER' | 'ADMIN' }
   * @returns {Promise<Object>} - обновленный пользователь
   */
  async updateRole(id, roleData) {
    try {
      const response = await api.patch(`/users/${id}/role`, roleData);
      return response;
    } catch (error) {
      console.error('[UsersService] Update role failed:', error);
      throw error;
    }
  },

  /**
   * Удалить пользователя
   * @param {string} id - ID пользователя
   * @returns {Promise<void>}
   */
  async delete(id) {
    try {
      await api.delete(`/users/${id}`);
    } catch (error) {
      console.error('[UsersService] Delete user failed:', error);
      throw error;
    }
  },
};

export default usersService;

