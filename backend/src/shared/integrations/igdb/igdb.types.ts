export type IgdbGame = {
    source: 'igdb';
    externalId: string;
    slug: string;
    title: string;
    cover: string | null;
    artwork: string | null;
    description: string | null;
    releaseDate: Date | null;
    genres: string[];
    platforms: string[];
    developer: string | null;
    publisher: string | null;
    popularity: number;
    igdbRating: number | null;
    igdbRatingCount: number;
};

export interface IgdbCatalog {
    isConfigured(): boolean;
    searchGames(query: string, limit?: number): Promise<IgdbGame[]>;
    getTrendingGames(limit?: number): Promise<IgdbGame[]>;
}

export type IgdbSyncOptions = {
    query?: string;
    limit?: number;
};
