import type { Response } from 'express';

export function sendSuccess<T>(response: Response, statusCode: number, message: string, data?: T): Response {
  return response.status(statusCode).json({ success: true, message, ...(data === undefined ? {} : { data }) });
}
