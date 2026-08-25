import { apiRequest, setAccessToken } from './client';
import type { AuthPayload, User } from '../types';

export const authApi = {
  async register(input: { firstName: string; lastName: string; email: string; password: string }) {
    return apiRequest<{ user: User; developmentToken?: string }>('/api/auth/register', { method: 'POST', body: input });
  },
  async verifyEmail(token: string) {
    return apiRequest<{ user: User }>('/api/auth/verify-email', { method: 'POST', body: { token } });
  },
  async resendVerification(email: string) {
    return apiRequest<{ developmentToken?: string }>('/api/auth/resend-verification', { method: 'POST', body: { email } });
  },
  async login(input: { email: string; password: string }) {
    const response = await apiRequest<AuthPayload>('/api/auth/login', { method: 'POST', body: input });
    setAccessToken(response.data!.accessToken);
    return response.data!;
  },
  async refresh() {
    const response = await apiRequest<AuthPayload>('/api/auth/refresh', { method: 'POST' });
    setAccessToken(response.data!.accessToken);
    return response.data!;
  },
  async logout() {
    await apiRequest('/api/auth/logout', { method: 'POST' });
    setAccessToken(null);
  },
  async forgotPassword(email: string) {
    return apiRequest<{ developmentToken?: string }>('/api/auth/forgot-password', { method: 'POST', body: { email } });
  },
  async resetPassword(token: string, password: string) {
    return apiRequest('/api/auth/reset-password', { method: 'POST', body: { token, password } });
  },
};
