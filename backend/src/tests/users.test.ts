import fastify, { type FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
    user: { findUnique: vi.fn(), findFirst: vi.fn() },
    userFollow: { findUnique: vi.fn() },
    review: { findMany: vi.fn(), aggregate: vi.fn() },
    userGame: { count: vi.fn() },
    userGameList: { findMany: vi.fn() },
}));

vi.mock('../shared/utils/prisma/prisma_conn.js', () => ({
    default: {
        user: db.user,
        userFollow: db.userFollow,
        review: db.review,
        userGame: db.userGame,
        userGameList: db.userGameList,
    },
}));

vi.mock('../shared/middlewares/check_token.js', () => ({
    checkToken: async (request: any) => {
        request.user = { id: 1, email: 'viewer@nexo.test', roleId: 1 };
    },
}));

import { usersRoutes } from '../modules/users/users.routes.js';
import { errorHandler } from '../shared/errors/error_handler.js';

const timestamp = new Date('2026-08-21T12:00:00.000Z');

function activeIdentity(overrides: Record<string, unknown> = {}) {
    return {
        id: 2,
        activate: true,
        deletedAt: null,
        blockedUser: null,
        ...overrides,
    };
}

let app: FastifyInstance;

beforeAll(async () => {
    app = fastify({ logger: false });
    app.setErrorHandler(errorHandler);
    await app.register(usersRoutes, { prefix: '/api/users' });
    await app.ready();
});

afterAll(async () => {
    await app.close();
});

beforeEach(() => {
    vi.clearAllMocks();
});

describe('Public users routes', () => {
    it('returns complete approved reviews with deterministic ordering', async () => {
        db.user.findUnique.mockResolvedValueOnce(activeIdentity());
        db.review.findMany.mockResolvedValueOnce([
            {
                id: 8,
                userId: 2,
                gameId: 12,
                rating: 4,
                text: 'Muito bom',
                status: 'approved',
                createdAt: timestamp,
                updatedAt: timestamp,
                game: { id: 12, title: 'Nexo Quest', cover: '/covers/12.jpg' },
            },
        ]);

        const response = await app.inject({
            method: 'GET',
            url: '/api/users/author/reviews',
            headers: { authorization: 'Bearer token' },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({
            reviews: [
                {
                    id: 8,
                    userId: 2,
                    gameId: 12,
                    rating: 4,
                    text: 'Muito bom',
                    status: 'approved',
                    createdAt: timestamp.toISOString(),
                    updatedAt: timestamp.toISOString(),
                    game: { id: 12, title: 'Nexo Quest', cover: '/covers/12.jpg' },
                },
            ],
            nextCursor: null,
        });
        expect(db.review.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { userId: 2, status: 'approved', deletedAt: null },
                orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            }),
        );
    });

    it('rejects reviews for inactive or blocked users', async () => {
        db.user.findUnique.mockResolvedValueOnce(activeIdentity({ blockedUser: { id: 9 } }));

        const response = await app.inject({
            method: 'GET',
            url: '/api/users/blocked/reviews',
            headers: { authorization: 'Bearer token' },
        });

        expect(response.statusCode).toBe(404);
        expect(db.review.findMany).not.toHaveBeenCalled();
    });

    it('counts unique library records rather than custom-list items', async () => {
        db.user.findUnique.mockResolvedValueOnce({
            ...activeIdentity(),
            createdAt: timestamp,
            profile: { followersCount: 12, followingCount: 4 },
        });
        db.review.aggregate.mockResolvedValueOnce({
            _count: 3,
            _avg: { rating: 4.5 },
        });
        db.userGame.count.mockResolvedValueOnce(6);

        const response = await app.inject({
            method: 'GET',
            url: '/api/users/author/stats',
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({
            totalReviews: 3,
            averageRating: 4.5,
            totalGames: 6,
            followersCount: 12,
            followingCount: 4,
            memberSince: timestamp.toISOString(),
        });
        expect(db.userGame.count).toHaveBeenCalledWith({ where: { userId: 2 } });
        expect(db.review.aggregate).toHaveBeenCalledWith({
            where: { userId: 2, status: 'approved', deletedAt: null },
            _avg: { rating: true },
            _count: true,
        });
        expect(db.userGameList.findMany).not.toHaveBeenCalled();
    });

    it('queries only public lists and serializes their games and items', async () => {
        db.user.findUnique.mockResolvedValueOnce(activeIdentity());
        db.userGameList.findMany.mockResolvedValueOnce([
            {
                id: 5,
                userId: 2,
                name: 'Favoritos públicos',
                isPublic: true,
                createdAt: timestamp,
                updatedAt: timestamp,
                items: [
                    {
                        id: 15,
                        listId: 5,
                        gameId: 12,
                        addedAt: timestamp,
                        game: { id: 12, title: 'Nexo Quest', cover: null },
                    },
                ],
            },
        ]);

        const response = await app.inject({
            method: 'GET',
            url: '/api/users/author/lists',
            headers: { authorization: 'Bearer token' },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json().lists[0]).toEqual({
            id: 5,
            userId: 2,
            name: 'Favoritos públicos',
            isPublic: true,
            itemCount: 1,
            createdAt: timestamp.toISOString(),
            updatedAt: timestamp.toISOString(),
            items: [
                {
                    id: 15,
                    listId: 5,
                    gameId: 12,
                    addedAt: timestamp.toISOString(),
                    game: { id: 12, title: 'Nexo Quest', cover: null },
                },
            ],
        });
        expect(db.userGameList.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: { userId: 2, isPublic: true } }),
        );
    });

    it('rejects stats and lists for inactive targets before reading their data', async () => {
        db.user.findUnique
            .mockResolvedValueOnce(activeIdentity({ activate: false }))
            .mockResolvedValueOnce(activeIdentity({ deletedAt: timestamp }));

        const [statsResponse, listsResponse] = await Promise.all([
            app.inject({ method: 'GET', url: '/api/users/inactive/stats' }),
            app.inject({
                method: 'GET',
                url: '/api/users/deleted/lists',
                headers: { authorization: 'Bearer token' },
            }),
        ]);

        expect(statsResponse.statusCode).toBe(404);
        expect(listsResponse.statusCode).toBe(404);
        expect(db.review.aggregate).not.toHaveBeenCalled();
        expect(db.userGameList.findMany).not.toHaveBeenCalled();
    });
});
