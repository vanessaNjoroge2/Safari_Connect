import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, UserRole, LoginPayload, RegisterPayload } from '../types';
import {
  clearAuthToken,
  getAuthToken,
  loginApi,
  mapAuthUserToFrontend,
  meApi,
  registerApi,
  setAuthToken,
} from '../lib/api';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toFrontendRole(role: string): UserRole {
  if (role === 'OWNER') return 'owner';
  if (role === 'ADMIN') return 'admin';
  return 'passenger';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    void (async () => {
      try {
        const me = await meApi(token);
        setUser(mapAuthUserToFrontend(me.data));
      } catch {
        clearAuthToken();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async ({ email, password, role }: LoginPayload): Promise<User> => {
    setIsLoading(true);
    try {
      const result = await loginApi({ email, password });
      const backendRole = toFrontendRole(result.data.user.role);

      if (backendRole !== role) {
        throw new Error(`This account is ${backendRole}, not ${role}`);
      }

      const mapped = mapAuthUserToFrontend(result.data.user);
      setAuthToken(result.data.token);
      setUser(mapped);
      return mapped;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload): Promise<User> => {
    setIsLoading(true);
    try {
      if (payload.role === 'admin') {
        throw new Error('Admin accounts are provisioned by platform admins');
      }

      const result = await registerApi(payload);
      const mapped = mapAuthUserToFrontend(result.data.user);
      setAuthToken(result.data.token);
      setUser({
        ...mapped,
        idNumber: payload.idNumber,
      });

      return {
        ...mapped,
        idNumber: payload.idNumber,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearAuthToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
