import { PAGINATION_DEFAULTS } from '../constants';

/**
 * Pagination helper interface
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Pagination metadata interface
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Paginated response interface
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Validates and normalizes pagination parameters
 * Ensures page and limit are within acceptable ranges
 */
export function validatePagination(params: PaginationParams): {
  skip: number;
  take: number;
  page: number;
} {
  const page = Math.max(
    params.page ?? PAGINATION_DEFAULTS.DEFAULT_PAGE,
    PAGINATION_DEFAULTS.DEFAULT_PAGE,
  );

  const limit = Math.min(
    Math.max(
      params.limit ?? PAGINATION_DEFAULTS.DEFAULT_LIMIT,
      PAGINATION_DEFAULTS.MIN_LIMIT,
    ),
    PAGINATION_DEFAULTS.MAX_LIMIT,
  );

  const skip = (page - 1) * limit;

  return {
    skip,
    take: limit,
    page,
  };
}

/**
 * Creates pagination metadata
 */
export function createPaginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Creates a paginated response object
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResponse<T> {
  return {
    data,
    meta: createPaginationMeta(total, page, limit),
  };
}
