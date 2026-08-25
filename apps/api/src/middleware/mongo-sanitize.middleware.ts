import type { RequestHandler } from 'express';

function removeUnsafeKeys(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(removeUnsafeKeys);
    return;
  }
  if (!value || typeof value !== 'object') return;
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (key.includes('$') || key.includes('.')) {
      delete record[key];
      continue;
    }
    removeUnsafeKeys(record[key]);
  }
}

/** Protects MongoDB queries without assigning to Express 5's read-only query getter. */
export const mongoSanitize: RequestHandler = (request, _response, next) => {
  removeUnsafeKeys(request.body);
  removeUnsafeKeys(request.params);
  removeUnsafeKeys(request.query);
  next();
};
