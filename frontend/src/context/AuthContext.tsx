import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, LoginPayload, RegisterPayload } from '../types';
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
  setUserProfile: (user: User) => void;
  logout: () => void;
}

const fallbackAuthContext: AuthContextValue = {
  user: null,
  isLoading: false,
  login: async () => {
    throw new Error('Auth provider unavailable');
  },
  register: async () => {
    throw new Error('Auth provider unavailable');
  },
  setUserProfile: () => {},
  logout: () => {},
};

const AuthContext = createContext<AuthContextValue | null>(null);

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

  const login = useCallback(async ({ email, password }: LoginPayload): Promise<User> => {
    setIsLoading(true);
    try {
      const result = await loginApi({ email, password });

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
      const result = await registerApi(payload);
      const mapped = mapAuthUserToFrontend(result.data.user);
      setAuthToken(result.data.token);
      setUser(mapped);
      return mapped;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearAuthToken();
    setUser(null);
  }, []);

  const setUserProfile = useCallback((nextUser: User) => {
    setUser(nextUser);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, setUserProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  return ctx ?? fallbackAuthContext;
}
