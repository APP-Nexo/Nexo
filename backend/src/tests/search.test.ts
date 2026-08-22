import fastify, { type FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
    user: { findMany: vi.fn(), count: vi.fn() },
}));

vi.mock('../shared/utils/prisma/prisma_conn.js', () => ({
    default: { user: db.user },
}));

import { searchRoutes } from '../modules/search/search.routes.js';
import { errorHandler } from '../shared/errors/error_handler.js';

function searchUser(id: number, username: string, followersCount = 5) {
    return {
        id,
        username,
        profile: { photo: `/avatars/${id}.png`, bio: `Bio ${username}`, followersCount },
    };
}

let app: FastifyInstance;

beforeAll(async () => {
    app = fastify({ logger: false });
    app.setErrorHandler(errorHandler);
    await app.register(searchRoutes, { prefix: '/api/search' });
    await app.ready();
});

afterAll(async () => {
    await app.close();
});

beforeEach(() => {
    vi.clearAllMocks();
});

describe('Public user search', () => {
    it('searches username only and returns an exact total', async () => {
        db.user.findMany.mockResolvedValueOnce([searchUser(1, 'testuser')]);
        db.user.count.mockResolvedValueOnce(7);

        const response = await app.inject({
            method: 'GET',
            url: '/api/search/users?q=test',
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({
            data: [
                {
                    id: 1,
                    username: 'testuser',
                    photo: '/avatars/1.png',
                    bio: 'Bio testuser',
                    followersCount: 5,
                },
            ],
            total: 7,
            hasMore: false,
            nextCursor: null,
        });

        const query = db.user.findMany.mock.calls[0]![0];
        expect(query.where).toEqual({
            activate: true,
            deletedAt: null,
            blockedUser: null,
            username: { contains: 'test', mode: 'insensitive' },
        });
        expect(JSON.stringify(query.where)).not.toContain('email');
        expect(db.user.count).toHaveBeenCalledWith({ where: query.where });
    });

    it('rejects one-character and implicit empty searches without querying users', async () => {
        const [shortResponse, emptyResponse] = await Promise.all([
            app.inject({ method: 'GET', url: '/api/search/users?q=a' }),
            app.inject({ method: 'GET', url: '/api/search/users?q=' }),
        ]);

        expect(shortResponse.statusCode).toBe(400);
        expect(emptyResponse.statusCode).toBe(400);
        expect(db.user.findMany).not.toHaveBeenCalled();
        expect(db.user.count).not.toHaveBeenCalled();
    });

    it('returns suggested active users only when suggested mode is explicit', async () => {
        db.user.findMany.mockResolvedValueOnce([searchUser(3, 'popular', 90)]);
        db.user.count.mockResolvedValueOnce(1);

        const response = await app.inject({
            method: 'GET',
            url: '/api/search/users?suggested=true',
        });

        expect(response.statusCode).toBe(200);
        expect(response.json().data[0]).toEqual({
            id: 3,
            username: 'popular',
            photo: '/avatars/3.png',
            bio: 'Bio popular',
            followersCount: 90,
        });
        expect(db.user.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { activate: true, deletedAt: null, blockedUser: null },
                orderBy: [{ profile: { followersCount: 'desc' } }, { id: 'desc' }],
            }),
        );
    });

    it('uses a deterministic cursor and reports hasMore independently from total', async () => {
        db.user.findMany.mockResolvedValueOnce([
            searchUser(10, 'alpha'),
            searchUser(11, 'alpine'),
            searchUser(12, 'alto'),
        ]);
        db.user.count.mockResolvedValueOnce(20);

        const response = await app.inject({
            method: 'GET',
            url: '/api/search/users?q=al&cursor=9&limit=2',
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toMatchObject({
            total: 20,
            hasMore: true,
            nextCursor: '11',
        });
        expect(response.json().data).toHaveLength(2);
        expect(db.user.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                cursor: { id: 9 },
                skip: 1,
                take: 3,
                orderBy: [{ username: 'asc' }, { id: 'asc' }],
            }),
        );
    });
});
