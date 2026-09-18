import { apiFetch } from './api';

export type AuthTokens = {
  tokenType: string;
  token: string;
  refreshToken: string;
  expiresIn: string;
};

export type RegisterPayload = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type LoginPayload = {
  identifier: string;
  password: string;
};

export const authApi = {
  register(payload: RegisterPayload) {
    return apiFetch<AuthTokens>('/auth/register', { method: 'POST', body: payload });
  },
  login(payload: LoginPayload) {
    return apiFetch<AuthTokens>('/auth/login', { method: 'POST', body: payload });
  },
  refresh(refreshToken: string) {
    return apiFetch<AuthTokens>('/auth/refresh', { method: 'POST', body: { refreshToken } });
  },
  logout(token: string, allSessions = false) {
    return apiFetch<{ message: string }>('/auth/logout', {
      method: 'POST',
      token,
      body: { allSessions },
    });
  },
};
