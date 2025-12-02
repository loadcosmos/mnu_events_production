import { api } from '../services/apiClient.js';

/**
 * Проверка доступности бэкенда
 * @returns {Promise<{available: boolean, message: string}>}
 */
export async function checkBackendAvailability() {
  try {
    // Пробуем простой GET запрос к health check или любому публичному эндпоинту
    // Используем увеличенный timeout, так как бэкенд может запускаться
    const response = await api.get('/auth/email-status', {
      timeout: 10000, // Увеличено до 10 секунд
      retry: false, // Не повторяем запрос при проверке
    });
    
    return {
      available: true,
      message: 'Backend is running',
      data: response,
    };
  } catch (error) {
    // Если это ошибка connection refused, бэкенд точно не запущен
    if (error.code === 'ERR_NETWORK' || 
        error.code === 'ECONNREFUSED' || 
        error.message?.includes('ERR_CONNECTION_REFUSED') ||
        error.status === 0) {
      return {
        available: false,
        message: 'Backend server is not running',
        error: 'Connection refused',
        hint: 'Please start the backend: cd backend && npm run start:dev',
      };
    }
    
    // Если получили ответ от сервера (даже с ошибкой), значит бэкенд работает
    if (error.status && error.status > 0) {
      return {
        available: true,
        message: 'Backend is running (but returned an error)',
        error: error.message,
      };
    }
    
    // Другие ошибки (timeout и т.д.)
    return {
      available: false,
      message: 'Cannot reach backend server',
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Показывает предупреждение в консоли, если бэкенд недоступен
 */
export async function warnIfBackendUnavailable() {
  if (import.meta.env.DEV) {
    // Даем бэкенду время на запуск (если он только что запустился)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const status = await checkBackendAvailability();
    
    if (!status.available) {
      console.warn('⚠️ [Backend Check] Backend server is not available!');
      console.warn('⚠️ [Backend Check]', status.message);
      if (status.hint) {
        console.warn('💡 [Backend Check]', status.hint);
      }
      console.warn('💡 [Backend Check] Or use: npm run start:dev (in backend folder)');
      console.warn('💡 [Backend Check] Or use: .\\start-clean.ps1 (Windows) or ./start-clean.sh (Linux/Mac)');
      console.warn('💡 [Backend Check] Check if backend is running: curl http://localhost:3001/api/auth/email-status');
    } else {
      console.log('✅ [Backend Check] Backend server is available');
    }
  }
}

