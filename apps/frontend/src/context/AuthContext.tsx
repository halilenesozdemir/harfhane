import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authApi from '../lib/auth-api';
import { initiateGoogleLogin } from '../lib/auth-api';
import type { AuthUser } from '../lib/auth-api';

const TOKEN_KEY = 'harfhane:token';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthCallback: boolean;
  googleAuthFailed: boolean;
  justLoggedIn: boolean;
  clearJustLoggedIn: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  loginWithGoogle: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [isLoading, setIsLoading] = useState(true);
  const [googleAuthFailed, setGoogleAuthFailed] = useState(false);
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const [isAuthCallback] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.has('token') || params.has('auth_error');
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleToken = params.get('token');
    const authError = params.get('auth_error');

    if (googleToken) {
      localStorage.setItem(TOKEN_KEY, googleToken);
      setToken(googleToken);
      setJustLoggedIn(true);
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      window.history.replaceState({}, '', url.toString());
    }

    if (authError) {
      setGoogleAuthFailed(true);
      const url = new URL(window.location.href);
      url.searchParams.delete('auth_error');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  useEffect(() => {
    if (!token) { setIsLoading(false); return; }
    authApi.getMe(token)
      .then(setUser)
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      })
      .finally(() => setIsLoading(false));
  }, [token]);

  const clearJustLoggedIn = useCallback((): void => setJustLoggedIn(false), []);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    const res = await authApi.login(email, password);
    localStorage.setItem(TOKEN_KEY, res.token);
    setToken(res.token);
    setUser(res.user);
  }, []);

  const register = useCallback(async (email: string, username: string, password: string): Promise<void> => {
    const res = await authApi.register(email, username, password);
    localStorage.setItem(TOKEN_KEY, res.token);
    setToken(res.token);
    setUser(res.user);
  }, []);

  const logout = useCallback((): void => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const loginWithGoogle = useCallback((): void => {
    initiateGoogleLogin();
  }, []);

  return (
    <AuthContext.Provider value={{
      user, token, isLoading, isAuthCallback,
      googleAuthFailed, justLoggedIn, clearJustLoggedIn,
      login, register, logout, loginWithGoogle,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
