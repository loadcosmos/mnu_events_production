import { toast } from 'sonner';

/**
 * Сервис для показа toast уведомлений
 * Использует Sonner для отображения уведомлений
 */
export const toastService = {
  /**
   * Показать успешное уведомление
   */
  success: (message, description) => {
    toast.success(message, {
      description,
      duration: 4000,
    });
  },

  /**
   * Показать ошибку
   */
  error: (message, description) => {
    toast.error(message, {
      description,
      duration: 5000,
    });
  },

  /**
   * Показать предупреждение
   */
  warning: (message, description) => {
    toast.warning(message, {
      description,
      duration: 4000,
    });
  },

  /**
   * Показать информационное сообщение
   */
  info: (message, description) => {
    toast.info(message, {
      description,
      duration: 4000,
    });
  },

  /**
   * Показать загрузку (promise toast)
   */
  promise: (promise, messages) => {
    return toast.promise(promise, {
      loading: messages.loading || 'Loading...',
      success: messages.success || 'Success!',
      error: messages.error || 'An error occurred',
    });
  },
};

export default toastService;



