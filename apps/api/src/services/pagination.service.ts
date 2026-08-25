import type { Request } from 'express';

export interface Pagination { page: number; limit: number; skip: number; }

export function getPagination(request: Request, maxLimit = 100): Pagination {
  const page = Math.max(1, Number.parseInt(String(request.query.page ?? '1'), 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, Number.parseInt(String(request.query.limit ?? '20'), 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

export function pageResult<T>(items: T[], total: number, pagination: Pagination) {
  return { items, pagination: { page: pagination.page, limit: pagination.limit, total, totalPages: Math.ceil(total / pagination.limit) } };
}
