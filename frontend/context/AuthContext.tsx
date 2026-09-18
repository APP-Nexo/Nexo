import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { setUnauthorizedHandler } from '../services/api';
import { authApi, type AuthTokens } from '../services/auth';

const STORAGE_KEY = 'nexo.auth.tokens';

type AuthContextValue = {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
    confirmPassword: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function persistTokens(tokens: AuthTokens | null) {
  if (tokens) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  } else {
    await AsyncStorage.removeItem(STORAGE_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Kept in sync with `tokens` so the 401 handler below always reads the
  // latest refresh token, without needing to re-register on every change.
  const tokensRef = useRef<AuthTokens | null>(null);
  const refreshInFlight = useRef<Promise<string | null> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as AuthTokens;
          tokensRef.current = parsed;
          setTokens(parsed);
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(async () => {
      if (refreshInFlight.current) return refreshInFlight.current;

      const current = tokensRef.current;
      if (!current?.refreshToken) return null;

      const attempt = (async () => {
        try {
          const response = await authApi.refresh(current.refreshToken);
          tokensRef.current = response;
          setTokens(response);
          await persistTokens(response);
          return response.token;
        } catch {
          tokensRef.current = null;
          setTokens(null);
          await persistTokens(null);
          return null;
        } finally {
          refreshInFlight.current = null;
        }
      })();

      refreshInFlight.current = attempt;
      return attempt;
    });

    return () => setUnauthorizedHandler(null);
  }, []);

  async function login(identifier: string, password: string) {
    const response = await authApi.login({ identifier, password });
    tokensRef.current = response;
    setTokens(response);
    await persistTokens(response);
  }

  async function register(
    username: string,
    email: string,
    password: string,
    confirmPassword: string,
  ) {
    const response = await authApi.register({ username, email, password, confirmPassword });
    tokensRef.current = response;
    setTokens(response);
    await persistTokens(response);
  }

  async function logout() {
    const currentToken = tokensRef.current?.token;
    tokensRef.current = null;
    setTokens(null);
    await persistTokens(null);
    if (currentToken) {
      // Sessão local já foi limpa; a revogação no servidor é best-effort.
      await authApi.logout(currentToken).catch(() => undefined);
    }
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      token: tokens?.token ?? null,
      isAuthenticated: Boolean(tokens?.token),
      isLoading,
      login,
      register,
      logout,
    }),
    [tokens, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>.');
  return ctx;
}
