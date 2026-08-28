import fastifyJwt from '@fastify/jwt';
import fastify from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
    game: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        upsert: vi.fn(),
    },
    review: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
    },
    userGame: {
        findUnique: vi.fn(),
    },
    user: {
        findUnique: vi.fn(),
    },
    authSession: {
        findFirst: vi.fn(),
    },
    $transaction: vi.fn(async (operations: Promise<unknown>[]) => Promise.all(operations)),
}));

vi.mock('../shared/utils/prisma/prisma_conn.js', () => ({ default: prismaMock }));

import type { Game } from '../generated/client.js';
import { gamesRoutes } from '../modules/games/games.routes.js';
import { type GamesDatabase, GamesService } from '../modules/games/games.service.js';
import { env } from '../shared/config/env.js';
import { type IgdbCatalog, IgdbClient, type IgdbGame } from '../shared/integrations/igdb/index.js';
import { JwtToken } from '../shared/utils/jwt/jwt_token.js';

const now = new Date('2026-08-21T12:00:00.000Z');

function game(overrides: Partial<Game> = {}): Game {
    return {
        id: 1,
        source: 'igdb',
        externalId: '1942',
        slug: 'halo-infinite',
        title: 'Halo Infinite',
        cover: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1.jpg',
        artwork: 'https://images.igdb.com/igdb/image/upload/t_1080p/ar1.jpg',
        description: 'A sci-fi shooter.',
        releaseDate: new Date('2021-12-08T00:00:00.000Z'),
        genres: ['Shooter'],
        platforms: ['PC (Microsoft Windows)', 'Xbox Series X|S'],
        developer: '343 Industries',
        publisher: 'Xbox Game Studios',
        popularity: 90,
        trendingRank: 1,
        trendingAt: now,
        igdbRating: 82.5,
        igdbRatingCount: 500,
        ratingSum: 45,
        ratingCount: 5,
        averageRating: 9,
        cachedAt: now,
        createdAt: now,
        updatedAt: now,
        ...overrides,
    };
}

function remoteGame(): IgdbGame {
    return {
        source: 'igdb',
        externalId: '1942',
        slug: 'halo-infinite',
        title: 'Halo Infinite',
        cover: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1.jpg',
        artwork: 'https://images.igdb.com/igdb/image/upload/t_1080p/ar1.jpg',
        description: 'A sci-fi shooter.',
        releaseDate: new Date('2021-12-08T00:00:00.000Z'),
        genres: ['Shooter'],
        platforms: ['PC (Microsoft Windows)'],
        developer: '343 Industries',
        publisher: 'Xbox Game Studios',
        popularity: 90,
        igdbRating: 82.5,
        igdbRatingCount: 500,
    };
}

function database() {
    return {
        game: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            upsert: vi.fn(),
        },
        review: {
            findMany: vi.fn(),
            findFirst: vi.fn(),
            findUnique: vi.fn(),
        },
        userGame: {
            findUnique: vi.fn(),
        },
        $transaction: vi.fn(async (operations: Promise<unknown>[]) => Promise.all(operations)),
    };
}

function catalog(configured = false) {
    return {
        isConfigured: vi.fn(() => configured),
        searchGames: vi.fn(),
        getTrendingGames: vi.fn(),
    };
}

function service(db: ReturnType<typeof database>, igdb: ReturnType<typeof catalog>) {
    return new GamesService({
        database: db as unknown as GamesDatabase,
        igdb: igdb as unknown as IgdbCatalog,
        cacheTtlMinutes: 60,
        now: () => now,
        logger: { warn: vi.fn() },
    });
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe('IgdbClient', () => {
    it('caches the Twitch token and normalizes validated games', async () => {
        const fetchMock = vi.fn();
        fetchMock
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        access_token: 'oauth-token',
                        expires_in: 3_600,
                        token_type: 'bearer',
                    }),
                    { status: 200 },
                ),
            )
            .mockImplementation(() =>
                Promise.resolve(
                    new Response(
                        JSON.stringify([
                            {
                                id: 1942,
                                slug: 'halo-infinite',
                                name: 'Halo Infinite',
                                summary: 'A sci-fi shooter.',
                                first_release_date: 1_638_921_600,
                                rating: 82.5,
                                rating_count: 500,
                                cover: { image_id: 'co1' },
                                artworks: [{ image_id: 'ar1' }],
                                genres: [{ name: 'Shooter' }],
                                platforms: [{ name: 'PC (Microsoft Windows)' }],
                                involved_companies: [
                                    {
                                        developer: true,
                                        publisher: false,
                                        company: { name: '343 Industries' },
                                    },
                                    {
                                        developer: false,
                                        publisher: true,
                                        company: { name: 'Xbox Game Studios' },
                                    },
                                ],
                            },
                        ]),
                        { status: 200 },
                    ),
                ),
            );

        const client = new IgdbClient({
            clientId: 'client-id',
            clientSecret: 'client-secret',
            timeoutMs: 500,
            fetchImpl: fetchMock as typeof fetch,
        });

        const first = await client.searchGames('Halo', 10);
        const second = await client.getTrendingGames(10);

        expect(fetchMock).toHaveBeenCalledTimes(3);
        expect(String(fetchMock.mock.calls[0]![0])).toContain('grant_type=client_credentials');
        expect(fetchMock.mock.calls[0]![1]?.signal).toBeInstanceOf(AbortSignal);
        expect(fetchMock.mock.calls[1]![1]?.signal).toBeInstanceOf(AbortSignal);
        expect(fetchMock.mock.calls[1]![1]?.headers).toMatchObject({
            Authorization: 'Bearer oauth-token',
            'Client-ID': 'client-id',
        });
        const trendingBody = String(fetchMock.mock.calls[2]![1]?.body);
        expect(trendingBody).not.toContain('popularity');
        expect(trendingBody).toContain('sort rating_count desc');
        expect(first[0]).toMatchObject({
            externalId: '1942',
            cover: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1.jpg',
            artwork: 'https://images.igdb.com/igdb/image/upload/t_1080p/ar1.jpg',
            developer: '343 Industries',
            publisher: 'Xbox Game Studios',
            popularity: 500,
            igdbRatingCount: 500,
        });
        expect(second).toHaveLength(1);
    });

    it('rejects malformed IGDB payloads explicitly', async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(
                new Response(JSON.stringify({ access_token: 'token', expires_in: 3_600 }), {
                    status: 200,
                }),
            )
            .mockResolvedValueOnce(new Response(JSON.stringify({ id: 1 }), { status: 200 }));
        const client = new IgdbClient({
            clientId: 'client-id',
            clientSecret: 'client-secret',
            fetchImpl: fetchMock as typeof fetch,
        });

        await expect(client.getTrendingGames()).rejects.toMatchObject({
            code: 'IGDB_INVALID_RESPONSE',
        });
    });

    it('does not call fetch when credentials are absent', async () => {
        const fetchMock = vi.fn();
        const client = new IgdbClient({
            clientId: undefined,
            clientSecret: undefined,
            fetchImpl: fetchMock as typeof fetch,
        });

        expect(client.isConfigured()).toBe(false);
        await expect(client.getTrendingGames()).rejects.toMatchObject({
            code: 'IGDB_NOT_CONFIGURED',
        });
        expect(fetchMock).not.toHaveBeenCalled();
    });
});

describe('GamesService', () => {
    it('uses an ID comparison cursor and does not lose a page when the cursor row is gone', async () => {
        const db = database();
        const igdb = catalog(false);
        db.game.findMany.mockResolvedValueOnce([
            game({ id: 11 }),
            game({ id: 12 }),
            game({ id: 15 }),
        ]);

        const result = await service(db, igdb).listGames({
            q: 'Halo',
            genre: 'Shooter',
            platform: 'PC (Microsoft Windows)',
            cursor: '10',
            limit: 2,
        });

        expect(db.game.findMany).toHaveBeenCalledWith({
            where: {
                title: { contains: 'Halo', mode: 'insensitive' },
                genres: { has: 'Shooter' },
                platforms: { has: 'PC (Microsoft Windows)' },
                id: { gt: 10 },
            },
            orderBy: { id: 'asc' },
            take: 3,
        });
        expect(result.data.map(({ id }) => id)).toEqual([11, 12]);
        expect(result.nextCursor).toBe('12');
    });

    it('serves an empty local cache without failing when IGDB is unconfigured', async () => {
        const db = database();
        const igdb = catalog(false);
        db.game.findMany.mockResolvedValueOnce([]);

        const result = await service(db, igdb).listGames({ q: 'missing' });

        expect(result).toEqual({ data: [], nextCursor: null });
        expect(db.game.findMany).toHaveBeenCalledTimes(1);
        expect(igdb.searchGames).not.toHaveBeenCalled();
    });

    it('syncs an empty search by source/externalId and then reads PostgreSQL again', async () => {
        const db = database();
        const igdb = catalog(true);
        const cachedGame = game();
        db.game.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([cachedGame]);
        db.game.upsert.mockResolvedValueOnce(cachedGame);
        igdb.searchGames.mockResolvedValueOnce([remoteGame()]);

        const result = await service(db, igdb).listGames({ q: 'Halo', limit: 10 });

        expect(igdb.searchGames).toHaveBeenCalledWith('Halo', 20);
        expect(db.game.upsert).toHaveBeenCalledTimes(1);
        const upsert = db.game.upsert.mock.calls[0]![0];
        expect(upsert.where).toEqual({
            source_externalId: { source: 'igdb', externalId: '1942' },
        });
        expect(upsert.create).toMatchObject({
            source: 'igdb',
            externalId: '1942',
            title: 'Halo Infinite',
            cachedAt: now,
        });
        expect(upsert.update).not.toHaveProperty('ratingSum');
        expect(db.$transaction).toHaveBeenCalledTimes(1);
        expect(db.game.findMany).toHaveBeenCalledTimes(2);
        expect(result.data[0]?.id).toBe(1);
    });

    it('coalesces concurrent synchronization for the same search', async () => {
        const db = database();
        const igdb = catalog(true);
        db.game.upsert.mockResolvedValue(game());
        let resolveSearch: (games: IgdbGame[]) => void = () => undefined;
        igdb.searchGames.mockReturnValue(
            new Promise<IgdbGame[]>((resolve) => {
                resolveSearch = resolve;
            }),
        );
        const games = service(db, igdb);

        const first = games.syncCatalog({ query: 'Halo', limit: 20 });
        const second = games.syncCatalog({ query: 'Halo', limit: 20 });
        expect(igdb.searchGames).toHaveBeenCalledTimes(1);
        resolveSearch([remoteGame()]);

        await expect(Promise.all([first, second])).resolves.toEqual([
            { configured: true, mode: 'search', fetched: 1, upserted: 1 },
            { configured: true, mode: 'search', fetched: 1, upserted: 1 },
        ]);
        expect(db.game.upsert).toHaveBeenCalledTimes(1);
    });

    it('includes viewer state only when a verified user id is supplied by the controller', async () => {
        const db = database();
        const igdb = catalog(false);
        db.game.findUnique.mockResolvedValueOnce(game());
        db.userGame.findUnique.mockResolvedValueOnce({
            status: 'playing',
            isFavorite: true,
            progress: 40,
            startedAt: now,
            completedAt: null,
            updatedAt: now,
        });
        db.review.findFirst.mockResolvedValueOnce({
            id: 7,
            rating: 9,
            text: 'Great',
            status: 'approved',
            createdAt: now,
            updatedAt: now,
        });

        const result = await service(db, igdb).getGame(1, 42);

        expect(result.viewer).toMatchObject({
            library: { status: 'playing', isFavorite: true, progress: 40 },
            review: { id: 7, rating: 9, status: 'approved' },
        });
        expect(db.userGame.findUnique).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { userId_gameId: { userId: 42, gameId: 1 } },
            }),
        );
    });
});

describe('gamesRoutes', () => {
    it('declares /search before /:id and serializes every catalog field', async () => {
        const cachedAt = new Date(Date.now() + 60_000);
        prismaMock.game.findMany.mockResolvedValueOnce([game({ cachedAt })]);
        const app = fastify();
        await app.register(gamesRoutes, { prefix: '/api/games' });

        const response = await app.inject({
            method: 'GET',
            url: '/api/games/search?q=Halo',
        });
        await app.close();

        expect(response.statusCode).toBe(200);
        expect(response.json().data[0]).toEqual({
            id: 1,
            source: 'igdb',
            externalId: '1942',
            slug: 'halo-infinite',
            title: 'Halo Infinite',
            cover: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1.jpg',
            artwork: 'https://images.igdb.com/igdb/image/upload/t_1080p/ar1.jpg',
            description: 'A sci-fi shooter.',
            releaseDate: '2021-12-08T00:00:00.000Z',
            genres: ['Shooter'],
            platforms: ['PC (Microsoft Windows)', 'Xbox Series X|S'],
            developer: '343 Industries',
            publisher: 'Xbox Game Studios',
            popularity: 90,
            igdbRating: 82.5,
            igdbRatingCount: 500,
            ratingSum: 45,
            ratingCount: 5,
            averageRating: 9,
            cachedAt: cachedAt.toISOString(),
        });
    });

    it('exposes viewer state only after optional JWT verification succeeds', async () => {
        prismaMock.game.findUnique.mockResolvedValue(game());
        prismaMock.userGame.findUnique.mockResolvedValue({
            status: 'playing',
            isFavorite: false,
            progress: 25,
            startedAt: now,
            completedAt: null,
            updatedAt: now,
        });
        prismaMock.review.findFirst.mockResolvedValue(null);

        prismaMock.user.findUnique.mockResolvedValue({
            id: 42,
            email: 'player@nexo.test',
            roleId: 1,
            activate: true,
            deletedAt: null,
            blockedUser: null,
        });
        prismaMock.authSession.findFirst.mockResolvedValue({ id: 'session-42' });

        const app = fastify();
        await app.register(fastifyJwt, { secret: env.secret });
        await app.register(gamesRoutes, { prefix: '/api/games' });
        await app.ready();
        const token = await JwtToken.create(
            { id: 42, email: 'player@nexo.test', roleId: 1 },
            'session-42',
        );

        const authenticated = await app.inject({
            method: 'GET',
            url: '/api/games/1',
            headers: { authorization: `Bearer ${token}` },
        });
        const invalid = await app.inject({
            method: 'GET',
            url: '/api/games/1',
            headers: { authorization: 'Bearer invalid-token' },
        });
        await app.close();

        expect(authenticated.statusCode).toBe(200);
        expect(authenticated.json().viewer.library).toMatchObject({
            status: 'playing',
            progress: 25,
        });
        expect(invalid.statusCode).toBe(401);
        expect(prismaMock.userGame.findUnique).toHaveBeenCalledTimes(1);
    });
});
