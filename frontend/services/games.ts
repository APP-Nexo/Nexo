import { apiFetch } from './api';

export type GameResponse = {
  id: number;
  source: string;
  externalId: string | null;
  slug: string;
  title: string;
  cover: string | null;
  artwork: string | null;
  description: string | null;
  releaseDate: string | null;
  genres: string[];
  platforms: string[];
  developer: string | null;
  publisher: string | null;
  popularity: number;
  igdbRating: number | null;
  igdbRatingCount: number;
  ratingSum: number;
  ratingCount: number;
  averageRating: number;
  cachedAt: string;
};

export type ViewerLibraryState = {
  status: 'want_to_play' | 'playing' | 'completed' | 'tried' | 'abandoned';
  isFavorite: boolean;
  progress: number | null;
  startedAt: string | null;
  completedAt: string | null;
  updatedAt: string;
};

export type ViewerReviewState = {
  id: number;
  rating: number;
  text: string | null;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
};

export type GameDetailResponse = GameResponse & {
  viewer: { library: ViewerLibraryState | null; review: ViewerReviewState | null } | null;
};

export type GameReviewResponse = {
  id: number;
  userId: number;
  gameId: number;
  rating: number;
  text: string | null;
  status: 'approved';
  createdAt: string;
  updatedAt: string;
  user: { id: number; username: string; photo: string | null };
};

export type GamesPage = { data: GameResponse[]; nextCursor: string | null };

export const gamesApi = {
  list(params: { q?: string; genre?: string; platform?: string; cursor?: string; limit?: number } = {}, token?: string | null) {
    return apiFetch<GamesPage>(`/games${toQuery(params)}`, { token });
  },
  trending(limit?: number, token?: string | null) {
    return apiFetch<{ data: GameResponse[] }>(`/games/trending${toQuery({ limit })}`, { token });
  },
  detail(id: number | string, token?: string | null) {
    return apiFetch<GameDetailResponse>(`/games/${id}`, { token });
  },
  reviews(id: number | string, params: { cursor?: string; limit?: number } = {}, token?: string | null) {
    return apiFetch<{ data: GameReviewResponse[]; nextCursor: string | null }>(
      `/games/${id}/reviews${toQuery(params)}`,
      { token },
    );
  },
};

export function toQuery(params: Record<string, string | number | boolean | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (entries.length === 0) return '';
  const search = new URLSearchParams();
  for (const [key, value] of entries) search.set(key, String(value));
  return `?${search.toString()}`;
}
