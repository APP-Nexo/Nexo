export const USER_GAME_STATUSES = [
    'want_to_play',
    'playing',
    'completed',
    'tried',
    'abandoned',
] as const;

export const LIST_NAME_MAX_LENGTH = 100;
export const LIBRARY_DEFAULT_LIMIT = 20;
export const LIBRARY_MAX_LIMIT = 50;
export { PRISMA_INT_MAX } from '../../shared/infrastructure/validation/prisma-values.js';

export type UserGameStatus = (typeof USER_GAME_STATUSES)[number];

export type LibraryGamesQuery = {
    status?: UserGameStatus;
    favorite?: boolean;
    cursor?: number;
    limit?: number;
};

export type LibraryFavoritesQuery = Omit<LibraryGamesQuery, 'favorite'>;

export type UpsertLibraryGamePayload = {
    status?: UserGameStatus;
    isFavorite?: boolean;
    progress?: number;
};

export type CreateLibraryListPayload = {
    name: string;
    isPublic?: boolean;
};

export type UpdateLibraryListPayload = {
    name?: string;
    isPublic?: boolean;
};

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

export type LibraryGamesResponse = {
    games: LibraryGameDTO[];
    nextCursor: number | null;
};

export type LibraryGameResponse = {
    game: LibraryGameDTO;
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

export type LibraryListsResponse = {
    lists: LibraryListDTO[];
};

export type LibraryListResponse = {
    list: LibraryListDTO;
};

export type LibraryListItemResponse = {
    item: LibraryListItemDTO;
};
