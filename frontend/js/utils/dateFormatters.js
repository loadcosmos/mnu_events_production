/**
 * Date formatting utilities
 * Provides consistent date formatting across the application
 */

import i18n from '../i18n/config';

const getLocale = () => {
  const lang = i18n.language || 'en';
  if (lang === 'kz') return 'kk';
  return lang;
};

/**
 * Formats a date string or Date object to a localized string
 * @param {string|Date} date - The date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '';

  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  };

  try {
    return new Date(date).toLocaleDateString(getLocale(), defaultOptions);
  } catch (error) {
    console.error('Error formatting date:', error);
    return String(date);
  }
};

/**
 * Formats a date to short format (e.g., "Jan 15, 2024")
 */
export const formatDateShort = (date) => {
  return formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Formats a time string or Date object to time only
 * @param {string|Date} date - The date/time to format
 * @returns {string} Formatted time string (e.g., "2:30 PM")
 */
export const formatTime = (date) => {
  if (!date) return '';

  try {
    return new Date(date).toLocaleTimeString(getLocale(), {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true, // customizable per locale if needed, but 12h is often preferred in UI
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return String(date);
  }
};

/**
 * Formats a date and time together
 * @param {string|Date} date - The date/time to format
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (date) => {
  if (!date) return '';

  try {
    return new Date(date).toLocaleString(getLocale(), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch (error) {
    console.error('Error formatting date/time:', error);
    return String(date);
  }
};

/**
 * Formats a date range (e.g., "Jan 15 - Jan 20, 2024")
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {string} Formatted date range string
 */
export const formatDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return '';

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const locale = getLocale();

    // Same year
    if (start.getFullYear() === end.getFullYear()) {
      // Same month
      if (start.getMonth() === end.getMonth()) {
        // Same day
        if (start.getDate() === end.getDate()) {
          return formatDateShort(start);
        }
        // Different days, same month
        return `${start.toLocaleDateString(locale, { month: 'short', day: 'numeric' })} - ${end.getDate()}, ${end.getFullYear()}`;
      }
      // Different months, same year
      return `${start.toLocaleDateString(locale, { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }

    // Different years
    return `${formatDateShort(start)} - ${formatDateShort(end)}`;
  } catch (error) {
    console.error('Error formatting date range:', error);
    return `${startDate} - ${endDate}`;
  }
};

/**
 * Checks if a date is in the past
 * @param {string|Date} date - The date to check
 * @returns {boolean} True if the date is in the past
 */
export const isPastDate = (date) => {
  if (!date) return false;
  return new Date(date) < new Date();
};

/**
 * Gets relative time string (e.g., "2 days ago", "in 3 hours")
 * @param {string|Date} date - The date to compare
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date) => {
  if (!date) return '';

  try {
    const now = new Date();
    const targetDate = new Date(date);
    const diffInSeconds = Math.floor((targetDate - now) / 1000);

    // Create formatter
    const rtf = new Intl.RelativeTimeFormat(getLocale(), { numeric: 'auto' });

    const intervals = [
      { unit: 'year', seconds: 31536000 },
      { unit: 'month', seconds: 2592000 },
      { unit: 'week', seconds: 604800 },
      { unit: 'day', seconds: 86400 },
      { unit: 'hour', seconds: 3600 },
      { unit: 'minute', seconds: 60 },
      { unit: 'second', seconds: 1 },
    ];

    for (const { unit, seconds } of intervals) {
      if (Math.abs(diffInSeconds) >= seconds) {
        const value = Math.round(diffInSeconds / seconds);
        return rtf.format(value, unit);
      }
    }

    return rtf.format(0, 'second'); // "now" or "0 seconds ago" depending on locale/implementation, usually "now" if numeric: auto
  } catch (error) {
    console.error('Error getting relative time:', error);
    return String(date);
  }
};
