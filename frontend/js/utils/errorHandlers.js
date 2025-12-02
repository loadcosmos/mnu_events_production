/**
 * Error handling utilities
 * Provides consistent error message extraction and handling
 */

/**
 * Extracts a user-friendly error message from an error object
 * @param {Error|Object} error - The error object
 * @param {string} defaultMessage - Default message if extraction fails
 * @returns {string} User-friendly error message
 */
export const extractErrorMessage = (error, defaultMessage = 'An error occurred') => {
  if (!error) return defaultMessage;

  // Axios error response
  if (error.response?.data?.message) {
    return Array.isArray(error.response.data.message)
      ? error.response.data.message.join(', ')
      : error.response.data.message;
  }

  // Standard error message
  if (error.message) {
    return error.message;
  }

  // String error
  if (typeof error === 'string') {
    return error;
  }

  return defaultMessage;
};

/**
 * Logs an error to console (only in development)
 * In production, this could send to an error tracking service like Sentry
 * @param {string} context - Context where the error occurred
 * @param {Error} error - The error object
 * @param {Object} metadata - Additional metadata to log
 */
export const logError = (context, error, metadata = {}) => {
  if (import.meta.env.DEV) {
    console.error(`[${context}]`, error, metadata);
  }

  // In production, send to error tracking service
  // Example: Sentry.captureException(error, { tags: { context }, extra: metadata });
};

/**
 * Determines if an error is a network error
 * @param {Error} error - The error object
 * @returns {boolean} True if it's a network error
 */
export const isNetworkError = (error) => {
  return (
    !error.response &&
    (error.code === 'ECONNABORTED' ||
      error.message === 'Network Error' ||
      error.message.includes('timeout'))
  );
};

/**
 * Determines if an error is an authentication error
 * @param {Error} error - The error object
 * @returns {boolean} True if it's an auth error
 */
export const isAuthError = (error) => {
  return error.response?.status === 401;
};

/**
 * Determines if an error is a validation error
 * @param {Error} error - The error object
 * @returns {boolean} True if it's a validation error
 */
export const isValidationError = (error) => {
  return error.response?.status === 400 && Array.isArray(error.response?.data?.message);
};

/**
 * Gets validation error messages as an object
 * @param {Error} error - The error object
 * @returns {Object} Object with field names as keys and error messages as values
 */
export const getValidationErrors = (error) => {
  if (!isValidationError(error)) return {};

  const messages = error.response.data.message;
  const errors = {};

  messages.forEach((msg) => {
    // Extract field name from message like "email must be an email"
    const match = msg.match(/^(\w+)\s/);
    const field = match ? match[1] : 'general';
    errors[field] = msg;
  });

  return errors;
};
