/**
 * Pagination constants for consistent pagination across the application
 */

export const PAGINATION_DEFAULTS = {
  /** Default number of items per page */
  DEFAULT_LIMIT: 10,
  /** Minimum number of items per page */
  MIN_LIMIT: 1,
  /** Maximum number of items per page (prevents abuse) */
  MAX_LIMIT: 100,
  /** Default page number */
  DEFAULT_PAGE: 1,
} as const;
