import type { NextFunction, Request, Response } from 'express';
import type { z } from 'zod';
import { ApiError } from '../utils/api-error.js';

export function validate(schema: z.ZodTypeAny) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    const result = schema.safeParse({ body: request.body, params: request.params, query: request.query });
    if (!result.success) {
      return next(new ApiError(422, 'Please correct the highlighted fields.', 'VALIDATION_ERROR', result.error.flatten()));
    }
    const data = result.data as { body?: unknown; query?: Record<string, unknown>; params?: Record<string, unknown> };
    if ('body' in data) request.body = data.body;
    if (data.query) {
      const target = request.query as Record<string, unknown>;
      Object.keys(target).forEach((key) => delete target[key]);
      Object.assign(target, data.query);
    }
    if (data.params) Object.assign(request.params, data.params);
    next();
  };
}
