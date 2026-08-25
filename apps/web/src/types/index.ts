export type UserRole = 'STUDENT' | 'FACULTY' | 'CLUB_COORDINATOR' | 'ADMIN' | 'SUPER_ADMIN';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: { code: string; details?: unknown };
}

export interface AuthPayload {
  user: User;
  accessToken: string;
}
