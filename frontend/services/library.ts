import { apiFetch } from './api';
import { toQuery } from './games';

export type UserGameStatus = 'want_to_play' | 'playing' | 'completed' | 'tried' | 'abandoned';

export type GameSummaryDTO = {
  id: number;
  slug: string;
  title: string;
  cover: string | null;
  releaseDate: string | null;
  genres: string[];
  platforms: string[];
  averageRating: number;
};

export type LibraryGameDTO = {
  id: number;
  gameId: number;
  status: UserGameStatus;
  isFavorite: boolean;
  progress: number | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  game: GameSummaryDTO;
};

export type LibraryListItemDTO = {
  id: number;
  listId: number;
  gameId: number;
  addedAt: string;
  game: GameSummaryDTO;
};

export type LibraryListDTO = {
  id: number;
  name: string;
  isPublic: boolean;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
  items: LibraryListItemDTO[];
};

export const libraryApi = {
  listGames(
    token: string,
    params: { status?: UserGameStatus; favorite?: boolean; cursor?: number; limit?: number } = {},
  ) {
    return apiFetch<{ games: LibraryGameDTO[]; nextCursor: number | null }>(
      `/library/games${toQuery(params)}`,
      { token },
    );
  },
  upsertGame(
    token: string,
    gameId: number | string,
    body: { status?: UserGameStatus; isFavorite?: boolean; progress?: number },
  ) {
    return apiFetch<{ game: LibraryGameDTO }>(`/library/games/${gameId}`, {
      method: 'PUT',
      token,
      body,
    });
  },
  removeGame(token: string, gameId: number | string) {
    return apiFetch<null>(`/library/games/${gameId}`, { method: 'DELETE', token });
  },
  favorites(token: string, params: { status?: UserGameStatus; cursor?: number; limit?: number } = {}) {
    return apiFetch<{ games: LibraryGameDTO[]; nextCursor: number | null }>(
      `/library/favorites${toQuery(params)}`,
      { token },
    );
  },
  lists(token: string) {
    return apiFetch<{ lists: LibraryListDTO[] }>('/library/lists', { token });
  },
  createList(token: string, body: { name: string; isPublic?: boolean }) {
    return apiFetch<{ list: LibraryListDTO }>('/library/lists', { method: 'POST', token, body });
  },
  updateList(token: string, id: number | string, body: { name?: string; isPublic?: boolean }) {
    return apiFetch<{ list: LibraryListDTO }>(`/library/lists/${id}`, {
      method: 'PATCH',
      token,
      body,
    });
  },
  deleteList(token: string, id: number | string) {
    return apiFetch<null>(`/library/lists/${id}`, { method: 'DELETE', token });
  },
  addGameToList(token: string, listId: number | string, gameId: number | string) {
    return apiFetch<{ item: LibraryListItemDTO }>(`/library/lists/${listId}/games/${gameId}`, {
      method: 'PUT',
      token,
    });
  },
  removeGameFromList(token: string, listId: number | string, gameId: number | string) {
    return apiFetch<null>(`/library/lists/${listId}/games/${gameId}`, {
      method: 'DELETE',
      token,
    });
  },
};
