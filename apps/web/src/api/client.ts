import type { ApiResponse } from '../types';

let accessToken: string | null = null;
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '';

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export class ApiClientError extends Error {
  public readonly status: number;
  public readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  authenticated?: boolean;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const { body, authenticated = false, headers, ...requestOptions } = options;
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...requestOptions,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(authenticated && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });
  const payload = (await response.json().catch(() => ({ success: false, message: 'The server returned an invalid response.' }))) as ApiResponse<T>;
  if (!response.ok || !payload.success) throw new ApiClientError(payload.message, response.status, payload.error?.code);
  return payload;
}
