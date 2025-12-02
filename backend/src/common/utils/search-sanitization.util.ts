/**
 * SECURITY: Search query sanitization utilities
 * Prevents ReDoS attacks and resource exhaustion
 */

const MAX_SEARCH_LENGTH = 100; // Maximum search query length
const SUSPICIOUS_PATTERNS = /[<>{}[\]\\]/g; // Characters that could cause issues

/**
 * Sanitize search query input
 * - Trims whitespace
 * - Limits length to prevent resource exhaustion
 * - Removes potentially dangerous characters
 * - Escapes special regex characters
 * 
 * @param search - Raw search input from user
 * @returns Sanitized search string or undefined if invalid
 */
export function sanitizeSearchQuery(search?: string): string | undefined {
  if (!search || typeof search !== 'string') {
    return undefined;
  }

  // Trim whitespace
  let sanitized = search.trim();

  // Return undefined if empty after trimming
  if (!sanitized) {
    return undefined;
  }

  // Limit length to prevent resource exhaustion
  if (sanitized.length > MAX_SEARCH_LENGTH) {
    sanitized = sanitized.substring(0, MAX_SEARCH_LENGTH);
  }

  // Remove suspicious characters that could cause issues
  sanitized = sanitized.replace(SUSPICIOUS_PATTERNS, '');

  // Return undefined if nothing left after sanitization
  if (!sanitized) {
    return undefined;
  }

  return sanitized;
}

/**
 * Validate and sanitize pagination parameters
 * Prevents extremely large page/limit values that could cause DoS
 * 
 * @param page - Page number
 * @param limit - Items per page
 * @returns Validated pagination parameters
 */
export function sanitizePaginationParams(page?: string | number, limit?: string | number) {
  const MAX_LIMIT = 100; // Maximum items per page
  const DEFAULT_PAGE = 1;
  const DEFAULT_LIMIT = 10;

  let validatedPage = DEFAULT_PAGE;
  let validatedLimit = DEFAULT_LIMIT;

  // Validate page
  if (page) {
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
    if (!isNaN(pageNum) && pageNum > 0 && pageNum < 10000) {
      validatedPage = pageNum;
    }
  }

  // Validate limit
  if (limit) {
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : limit;
    if (!isNaN(limitNum) && limitNum > 0 && limitNum <= MAX_LIMIT) {
      validatedLimit = limitNum;
    }
  }

  return {
    page: validatedPage,
    limit: validatedLimit,
  };
}
