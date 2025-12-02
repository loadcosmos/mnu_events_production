import { describe, it, expect } from 'vitest';
import {
  ROLES,
  CATEGORIES,
  EVENT_STATUSES,
  formatDate,
  formatTime,
  formatDateTime,
  getCategoryColor,
  getCategoryDisplayName,
  getStatusColor,
  getStatusDisplayName,
  extractErrorMessage,
} from '../js/utils';

describe('Utils - Constants', () => {
  it('should have correct role constants', () => {
    expect(ROLES).toEqual({
      STUDENT: 'STUDENT',
      ORGANIZER: 'ORGANIZER',
      ADMIN: 'ADMIN',
    });
  });

  it('should have all event categories', () => {
    expect(CATEGORIES).toHaveProperty('ACADEMIC');
    expect(CATEGORIES).toHaveProperty('SPORTS');
    expect(CATEGORIES).toHaveProperty('CULTURAL');
    expect(CATEGORIES).toHaveProperty('SOCIAL');
    expect(CATEGORIES).toHaveProperty('CAREER');
    expect(CATEGORIES).toHaveProperty('OTHER');
  });

  it('should have all event statuses', () => {
    expect(EVENT_STATUSES).toHaveProperty('DRAFT');
    expect(EVENT_STATUSES).toHaveProperty('UPCOMING');
    expect(EVENT_STATUSES).toHaveProperty('ONGOING');
    expect(EVENT_STATUSES).toHaveProperty('COMPLETED');
    expect(EVENT_STATUSES).toHaveProperty('CANCELLED');
  });
});

describe('Utils - Date Formatters', () => {
  it('should format date correctly', () => {
    const date = new Date('2025-11-20T14:30:00Z');
    const formatted = formatDate(date);
    expect(formatted).toBeTruthy();
    expect(typeof formatted).toBe('string');
  });

  it('should format time correctly', () => {
    const date = new Date('2025-11-20T14:30:00Z');
    const formatted = formatTime(date);
    expect(formatted).toBeTruthy();
    expect(typeof formatted).toBe('string');
  });

  it('should format datetime correctly', () => {
    const date = new Date('2025-11-20T14:30:00Z');
    const formatted = formatDateTime(date);
    expect(formatted).toBeTruthy();
    expect(typeof formatted).toBe('string');
  });

  it('should handle invalid date gracefully', () => {
    const result = formatDate('invalid-date');
    expect(result).toBe('Invalid date');
  });

  it('should handle null date', () => {
    const result = formatDate(null);
    expect(result).toBe('Invalid date');
  });
});

describe('Utils - Category Mappers', () => {
  it('should return correct color for each category', () => {
    expect(getCategoryColor('ACADEMIC')).toBeTruthy();
    expect(getCategoryColor('SPORTS')).toBeTruthy();
    expect(getCategoryColor('CULTURAL')).toBeTruthy();
    expect(getCategoryColor('SOCIAL')).toBeTruthy();
    expect(getCategoryColor('CAREER')).toBeTruthy();
    expect(getCategoryColor('OTHER')).toBeTruthy();
  });

  it('should return default color for unknown category', () => {
    const defaultColor = getCategoryColor('UNKNOWN');
    expect(defaultColor).toBe('bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100');
  });

  it('should return correct display name for each category', () => {
    expect(getCategoryDisplayName('ACADEMIC')).toBe('Academic');
    expect(getCategoryDisplayName('SPORTS')).toBe('Sports');
    expect(getCategoryDisplayName('CULTURAL')).toBe('Cultural');
    expect(getCategoryDisplayName('SOCIAL')).toBe('Social');
    expect(getCategoryDisplayName('CAREER')).toBe('Career');
    expect(getCategoryDisplayName('OTHER')).toBe('Other');
  });

  it('should return original value for unknown category', () => {
    expect(getCategoryDisplayName('UNKNOWN')).toBe('UNKNOWN');
  });
});

describe('Utils - Status Mappers', () => {
  it('should return correct color for each status', () => {
    expect(getStatusColor('DRAFT')).toBeTruthy();
    expect(getStatusColor('UPCOMING')).toBeTruthy();
    expect(getStatusColor('ONGOING')).toBeTruthy();
    expect(getStatusColor('COMPLETED')).toBeTruthy();
    expect(getStatusColor('CANCELLED')).toBeTruthy();
  });

  it('should return default color for unknown status', () => {
    const defaultColor = getStatusColor('UNKNOWN');
    expect(defaultColor).toBe('bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100');
  });

  it('should return correct display name for each status', () => {
    expect(getStatusDisplayName('DRAFT')).toBe('Draft');
    expect(getStatusDisplayName('UPCOMING')).toBe('Upcoming');
    expect(getStatusDisplayName('ONGOING')).toBe('Ongoing');
    expect(getStatusDisplayName('COMPLETED')).toBe('Completed');
    expect(getStatusDisplayName('CANCELLED')).toBe('Cancelled');
  });

  it('should return original value for unknown status', () => {
    expect(getStatusDisplayName('UNKNOWN')).toBe('UNKNOWN');
  });
});

describe('Utils - Error Handlers', () => {
  it('should extract message from error object', () => {
    const error = { message: 'Test error message' };
    expect(extractErrorMessage(error)).toBe('Test error message');
  });

  it('should extract message from axios error response', () => {
    const error = {
      response: {
        data: {
          message: 'API error message',
        },
      },
    };
    expect(extractErrorMessage(error)).toBe('API error message');
  });

  it('should extract message from axios error response with array', () => {
    const error = {
      response: {
        data: {
          message: ['Error 1', 'Error 2'],
        },
      },
    };
    expect(extractErrorMessage(error)).toBe('Error 1, Error 2');
  });

  it('should handle string error', () => {
    expect(extractErrorMessage('String error')).toBe('String error');
  });

  it('should return default message for unknown error', () => {
    expect(extractErrorMessage(null)).toBe('An error occurred');
    expect(extractErrorMessage(undefined)).toBe('An error occurred');
    expect(extractErrorMessage({})).toBe('An error occurred');
  });

  it('should handle axios network error', () => {
    const error = {
      response: undefined,
      request: {},
    };
    expect(extractErrorMessage(error)).toBe('Network error. Please check your connection.');
  });
});
