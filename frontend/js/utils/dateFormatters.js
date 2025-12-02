/**
 * Date formatting utilities
 * Provides consistent date formatting across the application
 */

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
    return new Date(date).toLocaleDateString('en-US', defaultOptions);
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
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
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
    return new Date(date).toLocaleString('en-US', {
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

    // Same year
    if (start.getFullYear() === end.getFullYear()) {
      // Same month
      if (start.getMonth() === end.getMonth()) {
        // Same day
        if (start.getDate() === end.getDate()) {
          return formatDateShort(start);
        }
        // Different days, same month
        return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.getDate()}, ${end.getFullYear()}`;
      }
      // Different months, same year
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
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
    const isPast = diffInSeconds < 0;
    const absDiff = Math.abs(diffInSeconds);

    const intervals = [
      { label: 'year', seconds: 31536000 },
      { label: 'month', seconds: 2592000 },
      { label: 'week', seconds: 604800 },
      { label: 'day', seconds: 86400 },
      { label: 'hour', seconds: 3600 },
      { label: 'minute', seconds: 60 },
      { label: 'second', seconds: 1 },
    ];

    for (const interval of intervals) {
      const count = Math.floor(absDiff / interval.seconds);
      if (count >= 1) {
        const plural = count > 1 ? 's' : '';
        return isPast
          ? `${count} ${interval.label}${plural} ago`
          : `in ${count} ${interval.label}${plural}`;
      }
    }

    return 'just now';
  } catch (error) {
    console.error('Error getting relative time:', error);
    return String(date);
  }
};
