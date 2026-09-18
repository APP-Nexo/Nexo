import { apiFetch } from './api';

export type MeResponse = {
  id: number;
  username: string;
  email: string;
  roleId: number;
  createdAt: string;
  profile: {
    friendlyId: string;
    photo: string | null;
    banner: string | null;
    bio: string | null;
    config: Record<string, unknown> | null;
    followersCount: number;
    followingCount: number;
  } | null;
};

export const meApi = {
  get(token: string) {
    return apiFetch<MeResponse>('/me', { token });
  },
  update(token: string, body: { username?: string; bio?: string }) {
    return apiFetch<MeResponse>('/me', { method: 'PUT', token, body });
  },
  changePassword(token: string, body: { currentPassword: string; newPassword: string }) {
    return apiFetch<{ message: string }>('/me/password', { method: 'PUT', token, body });
  },
  remove(token: string, password: string) {
    return apiFetch<{ message: string; deletedAt: string }>('/me', {
      method: 'DELETE',
      token,
      body: { password },
    });
  },
};
