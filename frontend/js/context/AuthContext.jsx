import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import authService from '../services/authService.js';

// Создаем контекст
const AuthContext = createContext(null);

/**
 * Hook для использования AuthContext
 * @returns {Object} контекст аутентификации
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};

/**
 * AuthProvider - провайдер контекста аутентификации
 * Оборачивает приложение и предоставляет состояние и методы аутентификации
 */
export const AuthProvider = ({ children }) => {
  // Состояние
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Инициализация - проверяем, есть ли активная сессия через httpOnly cookie
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if we have cached user data (optimization to avoid unnecessary API call)
        const cachedUser = authService.getUser();

        if (cachedUser) {
          // We have cached user, but verify with server (httpOnly cookie will be sent automatically)
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        } else {
          // No cached user, try to fetch from server (in case cookie exists but cache was cleared)
          try {
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);
          } catch (err) {
            // No valid session, that's okay
            setUser(null);
          }
        }
      } catch (err) {
        console.error('[AuthContext] Init failed:', err);
        // Session invalid, clear cache
        authService.clearAuthData();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Регистрация нового пользователя
   */
  const register = useCallback(async (userData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authService.register(userData);
      setUser(response.user);

      return response;
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Авторизация пользователя
   */
  const login = useCallback(async (credentials) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authService.login(credentials);
      setUser(response.user);

      return response;
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Выход из системы
   */
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await authService.logout();
    } catch (err) {
      console.error('[AuthContext] Logout error:', err);
    } finally {
      setUser(null);
      setError(null);
      setLoading(false);
    }
  }, []);

  /**
   * Обновление данных текущего пользователя
   */
  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      return currentUser;
    } catch (err) {
      console.error('[AuthContext] Refresh user failed:', err);
      setUser(null);
      throw err;
    }
  }, []);

  /**
   * Обновление профиля пользователя
   */
  const updateProfile = useCallback(async (userData) => {
    try {
      setLoading(true);
      setError(null);

      const updatedUser = await authService.updateProfile(userData);
      setUser(updatedUser);

      return updatedUser;
    } catch (err) {
      setError(err.message || 'Profile update failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Смена пароля
   */
  const changePassword = useCallback(async (passwordData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authService.changePassword(passwordData);
      return response;
    } catch (err) {
      setError(err.message || 'Password change failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Проверка, авторизован ли пользователь
   */
  const isAuthenticated = useCallback(() => {
    return !!user;
  }, [user]);

  /**
   * Проверка роли пользователя
   */
  const hasRole = useCallback((roles) => {
    if (!user || !user.role) return false;

    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }

    return user.role === roles;
  }, [user]);

  /**
   * Проверка прав доступа
   */
  const hasPermission = useCallback((permissions) => {
    if (!user || !user.permissions) return false;

    if (Array.isArray(permissions)) {
      return permissions.some(permission =>
        user.permissions.includes(permission)
      );
    }

    return user.permissions.includes(permissions);
  }, [user]);

  /**
   * Очистка ошибки
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Значение контекста
  const value = {
    // Состояние
    user,
    loading,
    error,

    // Методы аутентификации
    register,
    login,
    logout,
    refreshUser,
    updateProfile,
    changePassword,

    // Проверки
    isAuthenticated,
    hasRole,
    hasPermission,

    // Утилиты
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
