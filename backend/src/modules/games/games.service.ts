import type { Game, Prisma } from '../../generated/client.js';
import { env } from '../../shared/config/env.js';
import { AppError } from '../../shared/errors/app-error.js';
import {
    type IgdbCatalog,
    type IgdbGame,
    type IgdbSyncOptions,
    igdbClient,
} from '../../shared/integrations/igdb/index.js';
import prisma from '../../shared/utils/prisma/prisma_conn.js';
import type {
    GameDetailResponse,
    GameResponse,
    GamesPage,
    GamesSyncResult,
    ListGamesQuery,
    ReviewsPage,
    ReviewsQuery,
} from './games.types.js';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const PRISMA_INT_MAX = 2_147_483_647;

export type GamesDatabase = Pick<typeof prisma, 'game' | 'review' | 'userGame' | '$transaction'>;

export type GamesLogger = {
    warn(context: { error: unknown; operation: string }, message: string): void;
};

export type GamesServiceOptions = {
    database?: GamesDatabase;
    igdb?: IgdbCatalog;
    cacheTtlMinutes?: number;
    now?: () => Date;
    logger?: GamesLogger;
};

type NormalizedListQuery = {
    q: string | undefined;
    genre: string | undefined;
    platform: string | undefined;
    cursorId: number | undefined;
    limit: number;
};

const defaultLogger: GamesLogger = {
    warn(context, message) {
        console.warn(message, context);
    },
};

function positiveInteger(value: number, name: string): number {
    if (!Number.isSafeInteger(value) || value <= 0 || value > PRISMA_INT_MAX) {
        throw AppError.throw(`${name} must be a positive integer.`, 400);
    }
    return value;
}

function normalizeLimit(value: number | undefined): number {
    return Math.min(positiveInteger(value ?? DEFAULT_LIMIT, 'limit'), MAX_LIMIT);
}

function cursorId(value: string | undefined): number | undefined {
    if (value === undefined) return undefined;
    if (!/^[1-9]\d*$/.test(value)) throw AppError.throw('Invalid cursor.', 400);
    return positiveInteger(Number(value), 'cursor');
}

function optionalText(value: string | undefined, name: string, maxLength: number) {
    if (value === undefined) return undefined;
    const normalized = value.trim();
    if (normalized.length === 0) return undefined;
    if (normalized.length > maxLength) {
        throw AppError.throw(`${name} is too long.`, 400);
    }
    return normalized;
}

function iso(value: Date): string;
function iso(value: Date | null): string | null;
function iso(value: Date | null): string | null {
    return value?.toISOString() ?? null;
}

function toGameResponse(game: Game): GameResponse {
    return {
        id: game.id,
        source: game.source,
        externalId: game.externalId,
        slug: game.slug,
        title: game.title,
        cover: game.cover,
        artwork: game.artwork,
        description: game.description,
        releaseDate: iso(game.releaseDate),
        genres: game.genres,
        platforms: game.platforms,
        developer: game.developer,
        publisher: game.publisher,
        popularity: game.popularity,
        igdbRating: game.igdbRating,
        igdbRatingCount: game.igdbRatingCount,
        ratingSum: game.ratingSum,
        ratingCount: game.ratingCount,
        averageRating: game.averageRating,
        cachedAt: iso(game.cachedAt),
    };
}

function remoteGameData(game: IgdbGame, cachedAt: Date) {
    return {
        slug: game.slug,
        title: game.title,
        cover: game.cover,
        artwork: game.artwork,
        description: game.description,
        releaseDate: game.releaseDate,
        genres: game.genres,
        platforms: game.platforms,
        developer: game.developer,
        publisher: game.publisher,
        popularity: game.popularity,
        igdbRating: game.igdbRating,
        igdbRatingCount: game.igdbRatingCount,
        cachedAt,
    };
}

export class GamesService {
    private readonly database: GamesDatabase;
    private readonly igdb: IgdbCatalog;
    private readonly cacheTtlMs: number;
    private readonly now: () => Date;
    private readonly logger: GamesLogger;
    private readonly syncRequests = new Map<string, Promise<GamesSyncResult>>();

    constructor(options: GamesServiceOptions = {}) {
        this.database = options.database ?? prisma;
        this.igdb = options.igdb ?? igdbClient;
        this.now = options.now ?? (() => new Date());
        this.logger = options.logger ?? defaultLogger;

        const cacheTtlMinutes = options.cacheTtlMinutes ?? env.igdbCacheTtlMinutes;
        if (!Number.isSafeInteger(cacheTtlMinutes) || cacheTtlMinutes <= 0) {
            throw new RangeError('cacheTtlMinutes must be a positive integer.');
        }
        this.cacheTtlMs = cacheTtlMinutes * 60_000;
    }

    async listGames(query: ListGamesQuery = {}): Promise<GamesPage> {
        const normalized = this.normalizeListQuery(query);
        let games = await this.findGames(normalized);

        if (
            normalized.cursorId === undefined &&
            normalized.q !== undefined &&
            this.needsRefresh(games)
        ) {
            const refreshed = await this.trySync(
                { query: normalized.q, limit: Math.max(normalized.limit * 2, DEFAULT_LIMIT) },
                'search',
            );
            if (refreshed) games = await this.findGames(normalized);
        }

        const data = games.slice(0, normalized.limit).map(toGameResponse);
        return {
            data,
            nextCursor:
                games.length > normalized.limit && data.length > 0
                    ? String(data[data.length - 1]!.id)
                    : null,
        };
    }

    async trendingGames(limitValue?: number): Promise<{ data: GameResponse[] }> {
        const limit = normalizeLimit(limitValue);
        let games = await this.database.game.findMany({
            where: { trendingRank: { not: null } },
            orderBy: [{ trendingRank: 'asc' }, { id: 'asc' }],
            take: limit,
        });

        if (games.length === 0) {
            games = await this.database.game.findMany({
                orderBy: [{ popularity: 'desc' }, { id: 'asc' }],
                take: limit,
            });
        }

        if (this.needsTrendingRefresh(games)) {
            const refreshed = await this.trySync(
                { limit: Math.max(limit, DEFAULT_LIMIT) },
                'trending',
            );
            if (refreshed) {
                games = await this.database.game.findMany({
                    where: { trendingRank: { not: null } },
                    orderBy: [{ trendingRank: 'asc' }, { id: 'asc' }],
                    take: limit,
                });
            }
        }

        return { data: games.map(toGameResponse) };
    }

    async getGame(gameId: number, userId?: number): Promise<GameDetailResponse> {
        const id = positiveInteger(gameId, 'game id');
        const game = await this.database.game.findUnique({ where: { id } });
        if (!game) throw AppError.throw('Game not found.', 404);

        if (userId === undefined) return { ...toGameResponse(game), viewer: null };
        positiveInteger(userId, 'user id');

        const key = { userId, gameId: id };
        const [library, review] = await Promise.all([
            this.database.userGame.findUnique({
                where: { userId_gameId: key },
                select: {
                    status: true,
                    isFavorite: true,
                    progress: true,
                    startedAt: true,
                    completedAt: true,
                    updatedAt: true,
                },
            }),
            this.database.review.findFirst({
                where: { ...key, deletedAt: null },
                select: {
                    id: true,
                    rating: true,
                    text: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true,
                },
            }),
        ]);

        return {
            ...toGameResponse(game),
            viewer: {
                library: library
                    ? {
                          status: library.status,
                          isFavorite: library.isFavorite,
                          progress: library.progress,
                          startedAt: iso(library.startedAt),
                          completedAt: iso(library.completedAt),
                          updatedAt: iso(library.updatedAt),
                      }
                    : null,
                review: review
                    ? {
                          id: review.id,
                          rating: review.rating,
                          text: review.text,
                          status: review.status,
                          createdAt: iso(review.createdAt),
                          updatedAt: iso(review.updatedAt),
                      }
                    : null,
            },
        };
    }

    async getReviews(gameId: number, query: ReviewsQuery = {}): Promise<ReviewsPage> {
        const id = positiveInteger(gameId, 'game id');
        const limit = normalizeLimit(query.limit);
        const reviewCursor = cursorId(query.cursor);
        const game = await this.database.game.findUnique({ where: { id }, select: { id: true } });
        if (!game) throw AppError.throw('Game not found.', 404);

        const reviews = await this.database.review.findMany({
            where: {
                gameId: id,
                status: 'approved',
                deletedAt: null,
                user: { activate: true, deletedAt: null, blockedUser: null },
                ...(reviewCursor === undefined ? {} : { id: { lt: reviewCursor } }),
            },
            orderBy: { id: 'desc' },
            take: limit + 1,
            select: {
                id: true,
                userId: true,
                gameId: true,
                rating: true,
                text: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                user: {
                    select: {
                        id: true,
                        username: true,
                        profile: { select: { photo: true } },
                    },
                },
            },
        });

        const page = reviews.slice(0, limit);
        return {
            data: page.map((review) => ({
                id: review.id,
                userId: review.userId,
                gameId: review.gameId,
                rating: review.rating,
                text: review.text,
                status: 'approved',
                createdAt: iso(review.createdAt),
                updatedAt: iso(review.updatedAt),
                user: {
                    id: review.user.id,
                    username: review.user.username,
                    photo: review.user.profile?.photo ?? null,
                },
            })),
            nextCursor:
                reviews.length > limit && page.length > 0
                    ? String(page[page.length - 1]!.id)
                    : null,
        };
    }

    async syncCatalog(options: IgdbSyncOptions = {}): Promise<GamesSyncResult> {
        const query = optionalText(options.query, 'query', 100);
        const limit = normalizeLimit(options.limit ?? MAX_LIMIT);
        const mode = query === undefined ? 'trending' : 'search';

        if (!this.igdb.isConfigured()) {
            return { configured: false, mode, fetched: 0, upserted: 0 };
        }

        const key = `${mode}:${query ?? ''}:${limit}`;
        const running = this.syncRequests.get(key);
        if (running) return running;

        const request = this.performSync(query, limit, mode);
        this.syncRequests.set(key, request);
        try {
            return await request;
        } finally {
            if (this.syncRequests.get(key) === request) this.syncRequests.delete(key);
        }
    }

    private async performSync(
        query: string | undefined,
        limit: number,
        mode: 'search' | 'trending',
    ): Promise<GamesSyncResult> {
        const fetched = query
            ? await this.igdb.searchGames(query, limit)
            : await this.igdb.getTrendingGames(limit);
        const games = [...new Map(fetched.map((game) => [game.externalId, game])).values()];

        if (games.length > 0) {
            const cachedAt = this.now();
            const operations: Prisma.PrismaPromise<unknown>[] = games.map((game, index) => {
                const data = {
                    ...remoteGameData(game, cachedAt),
                    ...(mode === 'trending'
                        ? { trendingRank: index + 1, trendingAt: cachedAt }
                        : {}),
                };
                return this.database.game.upsert({
                    where: {
                        source_externalId: {
                            source: game.source,
                            externalId: game.externalId,
                        },
                    },
                    create: {
                        source: game.source,
                        externalId: game.externalId,
                        ...data,
                    },
                    update: data,
                });
            });
            if (mode === 'trending') {
                operations.unshift(
                    this.database.game.updateMany({
                        where: { source: 'igdb', trendingRank: { not: null } },
                        data: { trendingRank: null, trendingAt: null },
                    }),
                );
            }
            await this.database.$transaction(operations);
        }

        return {
            configured: true,
            mode,
            fetched: fetched.length,
            upserted: games.length,
        };
    }

    private normalizeListQuery(query: ListGamesQuery): NormalizedListQuery {
        return {
            q: optionalText(query.q, 'q', 100),
            genre: optionalText(query.genre, 'genre', 80),
            platform: optionalText(query.platform, 'platform', 80),
            cursorId: cursorId(query.cursor),
            limit: normalizeLimit(query.limit),
        };
    }

    private async findGames(query: NormalizedListQuery): Promise<Game[]> {
        const where: Prisma.GameWhereInput = {};
        if (query.q) where.title = { contains: query.q, mode: 'insensitive' };
        if (query.genre) where.genres = { has: query.genre };
        if (query.platform) where.platforms = { has: query.platform };
        if (query.cursorId !== undefined) where.id = { gt: query.cursorId };

        return this.database.game.findMany({
            where,
            orderBy: { id: 'asc' },
            take: query.limit + 1,
        });
    }

    private needsRefresh(games: Game[]): boolean {
        if (games.length === 0) return true;
        const staleBefore = this.now().getTime() - this.cacheTtlMs;
        return games.some((game) => game.cachedAt.getTime() <= staleBefore);
    }

    private needsTrendingRefresh(games: Game[]): boolean {
        if (games.length === 0) return true;
        const staleBefore = this.now().getTime() - this.cacheTtlMs;
        return games.some(
            (game) => game.trendingAt === null || game.trendingAt.getTime() <= staleBefore,
        );
    }

    private async trySync(options: IgdbSyncOptions, operation: string): Promise<boolean> {
        if (!this.igdb.isConfigured()) return false;
        try {
            await this.syncCatalog(options);
            return true;
        } catch (error) {
            this.logger.warn({ error, operation }, 'IGDB refresh failed; serving cached games.');
            return false;
        }
    }
}

export const gamesService = new GamesService();

export async function syncGamesCatalog(options: IgdbSyncOptions = {}): Promise<GamesSyncResult> {
    return gamesService.syncCatalog(options);
}
