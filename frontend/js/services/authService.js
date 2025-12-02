import { api } from './apiClient.js';

/**
 * Auth Service
 * Централизованный сервис для работы с аутентификацией
 */
const authService = {
  /**
   * Регистрация нового пользователя
   * @param {Object} userData - данные пользователя
   * @param {string} userData.email - email пользователя
   * @param {string} userData.password - пароль
   * @param {string} userData.name - имя пользователя (опционально)
   * @returns {Promise<Object>} - данные пользователя и токен
   */
  async register(userData) {
    try {
      const response = await api.post('/auth/register', {
        email: userData.email,
        password: userData.password,
        firstName: userData.name?.split(' ')[0] || '',
        lastName: userData.name?.split(' ').slice(1).join(' ') || '',
      });

      // При регистрации токен не выдается, так как email не верифицирован
      // Токен будет выдан после верификации email
      return response;
    } catch (error) {
      console.error('[AuthService] Register failed:', error);
      throw error;
    }
  },

  /**
   * Авторизация пользователя
   * @param {Object} credentials - учетные данные
   * @param {string} credentials.email - email
   * @param {string} credentials.password - пароль
   * @returns {Promise<Object>} - данные пользователя и токен
   */
  async login(credentials) {
    try {
      const response = await api.post('/auth/login', {
        email: credentials.email,
        password: credentials.password,
      });

      // Tokens are now stored in httpOnly cookies by the server
      // We only cache user data for quick access
      if (response.user) {
        this.saveUser(response.user);
      }

      return response;
    } catch (error) {
      console.error('[AuthService] Login failed:', error);
      throw error;
    }
  },

  /**
   * Выход из системы
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      // Опционально: отправляем запрос на сервер для инвалидации токена
      await api.post('/auth/logout');
    } catch (error) {
      console.error('[AuthService] Logout request failed:', error);
      // Продолжаем выход даже если запрос не удался
    } finally {
      // Очищаем локальные данные
      this.clearAuthData();
    }
  },

  /**
   * Получение текущего авторизованного пользователя
   * @returns {Promise<Object>} - данные пользователя
   */
  async getCurrentUser() {
    try {
      const response = await api.get('/auth/profile');

      // Обновляем сохраненные данные пользователя
      if (response) {
        this.saveUser(response);
      }

      return response;
    } catch (error) {
      console.error('[AuthService] Get current user failed:', error);
      // Если запрос не удался (например, токен невалидный), очищаем данные
      this.clearAuthData();
      throw error;
    }
  },

  /**
   * Обновление профиля пользователя
   * @param {Object} userData - новые данные пользователя
   * @returns {Promise<Object>} - обновленные данные
   */
  async updateProfile(userData) {
    try {
      const response = await api.put('/auth/profile', userData);

      if (response.user) {
        this.saveUser(response.user);
      }

      return response.user;
    } catch (error) {
      console.error('[AuthService] Update profile failed:', error);
      throw error;
    }
  },

  /**
   * Смена пароля
   * @param {Object} passwordData
   * @param {string} passwordData.currentPassword - текущий пароль
   * @param {string} passwordData.newPassword - новый пароль
   * @returns {Promise<Object>}
   */
  async changePassword(passwordData) {
    try {
      const response = await api.post('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      return response;
    } catch (error) {
      console.error('[AuthService] Change password failed:', error);
      throw error;
    }
  },

  /**
   * Запрос на восстановление пароля
   * @param {string} email - email пользователя
   * @returns {Promise<Object>}
   */
  async forgotPassword(email) {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response;
    } catch (error) {
      console.error('[AuthService] Forgot password failed:', error);
      throw error;
    }
  },

  /**
   * Сброс пароля с токеном
   * @param {Object} resetData
   * @param {string} resetData.token - токен восстановления
   * @param {string} resetData.password - новый пароль
   * @returns {Promise<Object>}
   */
  async resetPassword(resetData) {
    try {
      const response = await api.post('/auth/reset-password', {
        token: resetData.token,
        password: resetData.password,
      });

      return response;
    } catch (error) {
      console.error('[AuthService] Reset password failed:', error);
      throw error;
    }
  },

  /**
   * Проверка email (верификация)
   * @param {string} token - токен верификации
   * @returns {Promise<Object>}
   */
  async verifyEmail(verifyData) {
    try {
      // Бэкенд ожидает { email, code }, а не { token }
      const response = await api.post('/auth/verify-email', verifyData);
      
      // Tokens are now stored in httpOnly cookies by the server
      // We only cache user data for quick access
      if (response.user) {
        this.saveUser(response.user);
      }

      return response;
    } catch (error) {
      console.error('[AuthService] Email verification failed:', error);
      throw error;
    }
  },

  /**
   * Повторная отправка кода верификации
   * @param {string} email - email пользователя
   * @returns {Promise<Object>}
   */
  async resendVerificationCode(email) {
    try {
      const response = await api.post('/auth/resend-code', { email });
      return response;
    } catch (error) {
      console.error('[AuthService] Resend verification code failed:', error);
      throw error;
    }
  },

  // === Вспомогательные методы для работы с localStorage ===
  // NOTE: Tokens are now stored in httpOnly cookies (server-side)
  // We only cache user data for quick access and offline display

  /**
   * Сохранение данных пользователя в localStorage (для кэширования)
   * @param {Object} user - данные пользователя
   */
  saveUser(user) {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  },

  /**
   * Очистка кэшированных данных
   */
  clearAuthData() {
    localStorage.removeItem('user');
    api.clearCsrfToken(); // Clear CSRF token on logout
  },

  /**
   * Получение кэшированных данных пользователя из localStorage
   * NOTE: This is just a cache. Always verify with server for critical operations.
   * @returns {Object|null} данные пользователя или null
   */
  getUser() {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  },

  /**
   * Проверка авторизации (проверяем наличие кэшированного пользователя)
   * NOTE: This is just a client-side hint. Server validates httpOnly cookie.
   * @returns {boolean}
   */
  isAuthenticated() {
    // Check if we have cached user data
    // The actual auth is verified by server via httpOnly cookie
    return !!this.getUser();
  },

  /**
   * Проверка роли пользователя
   * @param {string|string[]} roles - роль или массив ролей
   * @returns {boolean}
   */
  hasRole(roles) {
    const user = this.getUser();
    if (!user || !user.role) return false;

    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }

    return user.role === roles;
  },

  /**
   * Проверка прав доступа
   * @param {string|string[]} permissions - права или массив прав
   * @returns {boolean}
   */
  hasPermission(permissions) {
    const user = this.getUser();
    if (!user || !user.permissions) return false;

    if (Array.isArray(permissions)) {
      return permissions.some(permission =>
        user.permissions.includes(permission)
      );
    }

    return user.permissions.includes(permissions);
  },
};

export default authService;
