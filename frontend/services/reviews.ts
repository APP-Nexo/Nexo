import { apiFetch } from './api';

export type ReviewResponse = {
  id: number;
  userId: number;
  gameId: number;
  rating: number;
  text: string | null;
  status: 'pending' | 'approved' | 'rejected';
  version: number;
  createdAt: string;
  updatedAt: string;
  user: { id: number; username: string; photo: string | null };
  game: { id: number; title: string; cover: string | null };
};

export const reviewsApi = {
  create(token: string, gameId: number | string, body: { rating: number; text?: string | null }) {
    return apiFetch<ReviewResponse>(`/reviews/game/${gameId}`, { method: 'POST', token, body });
  },
  update(token: string, id: number | string, body: { rating?: number; text?: string | null }) {
    return apiFetch<ReviewResponse>(`/reviews/${id}`, { method: 'PATCH', token, body });
  },
  remove(token: string, id: number | string) {
    return apiFetch<null>(`/reviews/${id}`, { method: 'DELETE', token });
  },
  report(token: string, id: number | string, reason: string) {
    return apiFetch<{ id: number; status: string }>(`/reviews/${id}/reports`, {
      method: 'POST',
      token,
      body: { reason },
    });
  },
};
