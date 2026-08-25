import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authApi } from '../api/auth';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  register: (input: { firstName: string; lastName: string; email: string; password: string }) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const session = await authApi.refresh();
      setUser(session.user);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshSession().finally(() => setIsLoading(false));
  }, [refreshSession]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isLoading,
    refreshSession,
    register: async (input) => {
      const session = await authApi.register(input);
      setUser(session.user);
    },
    login: async (email, password) => {
      const session = await authApi.login({ email, password });
      setUser(session.user);
    },
    logout: async () => {
      await authApi.logout();
      setUser(null);
    },
  }), [isLoading, refreshSession, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
