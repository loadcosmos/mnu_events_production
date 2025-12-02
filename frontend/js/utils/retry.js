/**
 * Утилита для повторных попыток выполнения асинхронных операций
 * 
 * @param {Function} fn - Функция для выполнения
 * @param {Object} options - Опции для retry
 * @param {number} options.maxRetries - Максимальное количество попыток (по умолчанию 3)
 * @param {number} options.delay - Задержка между попытками в мс (по умолчанию 1000)
 * @param {Function} options.shouldRetry - Функция для определения, нужно ли повторять попытку
 * @returns {Promise} - Promise с результатом выполнения функции
 */
export async function retry(fn, options = {}) {
  const {
    maxRetries = 3,
    delay = 1000,
    shouldRetry = (error) => {
      // По умолчанию повторяем только для сетевых ошибок и 5xx ошибок
      // НЕ повторяем для 4xx ошибок (клиентские ошибки)
      if (!error.response) {
        return true; // Сетевая ошибка - повторяем
      }
      const status = error.response.status;
      // Повторяем только для серверных ошибок (5xx)
      // НЕ повторяем для клиентских ошибок (4xx)
      return status >= 500 && status < 600;
    },
  } = options;

  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Если это последняя попытка или не нужно повторять, выбрасываем ошибку
      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }
      
      // Ждем перед следующей попыткой (exponential backoff)
      const waitTime = delay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError;
}

/**
 * Создает функцию с retry логикой для axios запросов
 */
export function withRetry(axiosRequest, options = {}) {
  return retry(() => axiosRequest(), options);
}

