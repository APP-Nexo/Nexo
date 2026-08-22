export type ListGamesQuery = {
    q?: string;
    genre?: string;
    platform?: string;
    cursor?: string;
    limit?: number;
};

export type ReviewsQuery = {
    cursor?: string;
    limit?: number;
};

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
    viewer: {
        library: ViewerLibraryState | null;
        review: ViewerReviewState | null;
    } | null;
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
    user: {
        id: number;
        username: string;
        photo: string | null;
    };
};

export type GamesPage = {
    data: GameResponse[];
    nextCursor: string | null;
};

export type ReviewsPage = {
    data: GameReviewResponse[];
    nextCursor: string | null;
};

export type GamesSyncResult = {
    configured: boolean;
    mode: 'search' | 'trending';
    fetched: number;
    upserted: number;
};
