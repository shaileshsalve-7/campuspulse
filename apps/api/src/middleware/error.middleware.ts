import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { ApiError } from '../utils/api-error.js';

export const notFound: RequestHandler = (request, _response, next) => {
  next(new ApiError(404, `No route matches ${request.method} ${request.originalUrl}.`, 'ROUTE_NOT_FOUND'));
};

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ZodError) {
    return response.status(422).json({ success: false, message: 'Invalid request data.', error: { code: 'VALIDATION_ERROR', details: error.flatten() } });
  }
  if (error instanceof ApiError) {
    return response.status(error.statusCode).json({ success: false, message: error.message, error: { code: error.code, details: error.details } });
  }
  if (error?.code === 11000) {
    return response.status(409).json({ success: false, message: 'A record with that value already exists.', error: { code: 'DUPLICATE_RESOURCE' } });
  }
  console.error(error);
  return response.status(500).json({
    success: false,
    message: 'An unexpected server error occurred.',
    error: { code: 'INTERNAL_SERVER_ERROR', ...(env.NODE_ENV === 'development' ? { details: error?.message } : {}) },
  });
};
