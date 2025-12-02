import axios from 'axios';
import { toast } from 'sonner';
import { retry } from '../utils/retry.js';

// Базовый URL API - используем относительный путь для Vite proxy в dev mode
// Dev mode: Vite проксирует /api -> http://backend:3001/api (see vite.config.js)
// Production: MUST set VITE_API_URL env var (e.g., https://api.mnu-events.com/api)
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : (() => {
  console.error('[API Client] CRITICAL: VITE_API_URL not set in production build!');
  console.error('[API Client] Falling back to /api - this will likely fail unless using same-origin deployment');
  return '/api';
})());

// Логируем используемый API URL при загрузке (для отладки)
if (import.meta.env.DEV) {
  console.log('[API Client] Using API base URL:', API_BASE_URL);
  console.log('[API Client] VITE_API_URL from env:', import.meta.env.VITE_API_URL || 'not set (using default)');
}

// Создание axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable cookies for httpOnly JWT tokens
});

// CSRF Token storage
let csrfToken = null;
let csrfTokenPromise = null; // Mutex to prevent concurrent token fetches

// Function to fetch CSRF token with race condition prevention
const fetchCsrfToken = async () => {
  // If a fetch is already in progress, return the existing promise
  if (csrfTokenPromise) {
    return csrfTokenPromise;
  }

  // Create new fetch promise
  csrfTokenPromise = (async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/csrf-token`, {
        withCredentials: true,
      });
      csrfToken = response.data.csrfToken;
      return csrfToken;
    } catch (error) {
      console.error('[API Client] Failed to fetch CSRF token:', error);
      return null;
    } finally {
      // Clear promise after completion (success or failure)
      csrfTokenPromise = null;
    }
  })();

  return csrfTokenPromise;
};

// Request Interceptor - adds CSRF token for state-changing requests
apiClient.interceptors.request.use(
  async (config) => {
    // For state-changing methods, add CSRF token
    if (['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase())) {
      // Get CSRF token if not already fetched
      if (!csrfToken) {
        await fetchCsrfToken();
      }

      if (csrfToken) {
        config.headers['x-csrf-token'] = csrfToken;
      }
    }

    // No longer need to manually add Authorization header
    // JWT is sent automatically via httpOnly cookies

    // Logging requests in dev mode
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data);
    }

    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response Interceptor - обработка ответов и ошибок
apiClient.interceptors.response.use(
  (response) => {
    // Логирование успешных ответов в dev режиме
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }

    return response.data;
  },
  async (error) => {
    // Детальная обработка различных типов ошибок
    if (error.response) {
      // Сервер ответил с кодом ошибки
      const { status, data } = error.response;

      // Получаем сообщение об ошибке
      const errorMessage = Array.isArray(data?.message)
        ? data.message.join(', ')
        : data?.message || 'An error occurred';

      switch (status) {
        case 401:
          // Unauthorized - session expired or token revoked
          console.error('[API Error] Unauthorized - redirecting to login');

          // Clear CSRF token
          csrfToken = null;

          toast.error('Session expired', {
            description: 'Please log in again',
            duration: 3000,
          });

          // Redirect to login page
          if (window.location.pathname !== '/login' && window.location.pathname !== '/admin/login') {
            setTimeout(() => {
              window.location.href = '/login';
            }, 1000);
          }
          break;

        case 403:
          // Check if this is a CSRF token error
          if (errorMessage?.toLowerCase().includes('csrf') || errorMessage?.toLowerCase().includes('invalid token')) {
            console.error('[API Error] CSRF token invalid - clearing and refetching');
            csrfToken = null; // Clear invalid token

            toast.error('Security token expired', {
              description: 'Please try your action again',
              duration: 4000,
            });

            // Fetch new token in background for next request
            fetchCsrfToken().catch(console.error);
          } else {
            // Regular forbidden error - insufficient permissions
            console.error('[API Error] Forbidden - insufficient permissions');
            toast.error('Access denied', {
              description: 'You do not have permission to perform this action',
              duration: 4000,
            });
          }
          break;

        case 404:
          // Not Found
          console.error('[API Error] Resource not found');
          toast.error('Not found', {
            description: 'The requested resource was not found',
            duration: 4000,
          });
          break;

        case 422:
          // Validation Error
          console.error('[API Error] Validation failed', data);
          toast.error('Validation failed', {
            description: errorMessage,
            duration: 5000,
          });
          break;

        case 500:
        case 502:
        case 503:
          // Server Error
          console.error('[API Error] Server error', data);
          toast.error('Server error', {
            description: 'Something went wrong on the server. Please try again later.',
            duration: 5000,
          });
          break;

        default:
          console.error(`[API Error] ${status}`, data);
          toast.error('Error', {
            description: errorMessage,
            duration: 4000,
          });
      }

      // Создаем более удобный объект ошибки
      const apiError = {
        status,
        message: data?.message || 'An error occurred',
        errors: data?.errors || {},
        data: data,
      };

      return Promise.reject(apiError);
    } else if (error.request) {
      // Запрос был отправлен, но ответа не получено
      console.error('[API Error] No response received', error.request);
      
      // Определяем тип ошибки для более информативного сообщения
      let errorMessage = 'Unable to connect to the server.';
      let errorDescription = 'Please check your internet connection.';
      
      // Проверяем, является ли это ошибкой connection refused (бэкенд не запущен)
      if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED' || error.message?.includes('ERR_CONNECTION_REFUSED')) {
        errorMessage = 'Backend server is not running';
        errorDescription = `Cannot connect to ${API_BASE_URL}. Please make sure the backend is running on port 3001.`;
        
        console.error('[API Error] Backend connection refused:', {
          baseURL: API_BASE_URL,
          code: error.code,
          message: error.message,
          hint: 'Make sure backend is running: cd backend && npm run start:dev',
        });
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = 'Connection timeout';
        errorDescription = 'The server is taking too long to respond. Please try again later.';
      }

      toast.error(errorMessage, {
        description: errorDescription,
        duration: 6000,
      });

      return Promise.reject({
        status: 0,
        message: errorMessage,
        description: errorDescription,
        code: error.code,
        errors: {},
      });
    } else {
      // Ошибка при настройке запроса
      console.error('[API Error] Request setup failed', error.message);

      toast.error('Request failed', {
        description: error.message || 'An unexpected error occurred',
        duration: 4000,
      });

      return Promise.reject({
        status: 0,
        message: error.message || 'Request failed',
        errors: {},
      });
    }
  }
);

// Вспомогательные методы для удобства использования
export const api = {
  // GET запрос с retry
  get: (url, config = {}) => {
    const request = () => apiClient.get(url, config);
    // Retry только для GET запросов и только если явно не отключен
    if (config.retry !== false && config.retry !== undefined) {
      return retry(request, {
        maxRetries: config.maxRetries || 2,
        delay: config.retryDelay || 1000,
      });
    }
    // По умолчанию для GET не используем retry (чтобы избежать множественных toast)
    return request();
  },

  // POST запрос с retry (только если явно включен)
  post: (url, data = {}, config = {}) => {
    const request = () => apiClient.post(url, data, config);
    // Retry только если явно включен (для критичных операций)
    if (config.retry === true) {
      return retry(request, {
        maxRetries: config.maxRetries || 2,
        delay: config.retryDelay || 1000,
      });
    }
    return request();
  },

  // PUT запрос с retry (только если явно включен)
  put: (url, data = {}, config = {}) => {
    const request = () => apiClient.put(url, data, config);
    if (config.retry === true) {
      return retry(request, {
        maxRetries: config.maxRetries || 2,
        delay: config.retryDelay || 1000,
      });
    }
    return request();
  },

  // PATCH запрос с retry (только если явно включен)
  patch: (url, data = {}, config = {}) => {
    const request = () => apiClient.patch(url, data, config);
    if (config.retry === true) {
      return retry(request, {
        maxRetries: config.maxRetries || 2,
        delay: config.retryDelay || 1000,
      });
    }
    return request();
  },

  // DELETE запрос с retry (только если явно включен)
  delete: (url, config = {}) => {
    const request = () => apiClient.delete(url, config);
    if (config.retry === true) {
      return retry(request, {
        maxRetries: config.maxRetries || 2,
        delay: config.retryDelay || 1000,
      });
    }
    return request();
  },

  // Установка базового URL (полезно для тестирования)
  setBaseURL: (url) => {
    apiClient.defaults.baseURL = url;
  },

  // Get CSRF token (for manual use if needed)
  getCsrfToken: async () => {
    if (!csrfToken) {
      await fetchCsrfToken();
    }
    return csrfToken;
  },

  // Clear CSRF token (e.g., on logout)
  clearCsrfToken: () => {
    csrfToken = null;
  },
};

// Initialize CSRF token on app load
if (typeof window !== 'undefined') {
  fetchCsrfToken().catch(console.error);
}

export default apiClient;
