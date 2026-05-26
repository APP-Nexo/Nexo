import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { closeApp, startApp } from './tests.setup.js';

vi.mock('../shared/utils/prisma/prisma_conn.js', () => ({
    default: {
        user: { findUnique: vi.fn(), findMany: vi.fn() },
        userFollow: {
            findFirst: vi.fn(),
            findMany: vi.fn().mockResolvedValue([]),
            create: vi.fn(),
            delete: vi.fn(),
        },
        review: { findMany: vi.fn() },
        $executeRaw: vi.fn(),
    },
}));

vi.mock('../shared/middlewares/check_token.js', () => ({
    checkToken: async (req: any, _reply: any) => {
        req.user = { id: 1, name: 'Test User', email: 'test@email.com', roleId: 1 };
    },
}));

import { app } from '../conf.js';
import prisma from '../shared/utils/prisma/prisma_conn.js';

beforeAll(async () => await startApp());
afterAll(async () => await closeApp());

beforeEach(() => {
    vi.clearAllMocks();
});

describe('Social Routes', () => {
    describe('POST /social/:username/follow', () => {
        it('should follow a user', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
                id: 2,
                name: 'Other',
                username: 'other',
            } as any);
            vi.mocked(prisma.userFollow.findFirst).mockResolvedValueOnce(null);

            const response = await app.inject({
                method: 'POST',
                url: '/api/social/other/follow',
                headers: { authorization: 'Bearer token' },
            });

            expect(response.statusCode).toBe(201);
            expect(response.json()).toHaveProperty('message');
        });
    });

    describe('DELETE /social/:username/follow', () => {
        it('should unfollow a user', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
                id: 2,
                name: 'Other',
                username: 'other',
            } as any);
            vi.mocked(prisma.userFollow.findFirst).mockResolvedValueOnce({
                followerId: 1,
                followingId: 2,
            } as any);

            const response = await app.inject({
                method: 'DELETE',
                url: '/api/social/other/follow',
                headers: { authorization: 'Bearer token' },
            });

            expect(response.statusCode).toBe(200);
        });
    });

    describe('GET /social/:username/followers', () => {
        it('should return followers list', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
                id: 2,
                username: 'other',
            } as any);
            vi.mocked(prisma.userFollow.findMany).mockResolvedValueOnce([]);
            vi.mocked(prisma.user.findMany).mockResolvedValueOnce([]);

            const response = await app.inject({
                method: 'GET',
                url: '/api/social/other/followers',
                headers: { authorization: 'Bearer token' },
            });

            expect(response.statusCode).toBe(200);
            expect(response.json()).toHaveProperty('followers');
        });
    });

    describe('GET /social/:username/following', () => {
        it('should return following list', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
                id: 2,
                username: 'other',
            } as any);
            vi.mocked(prisma.userFollow.findMany).mockResolvedValueOnce([]);
            vi.mocked(prisma.user.findMany).mockResolvedValueOnce([]);

            const response = await app.inject({
                method: 'GET',
                url: '/api/social/other/following',
                headers: { authorization: 'Bearer token' },
            });

            expect(response.statusCode).toBe(200);
            expect(response.json()).toHaveProperty('following');
        });
    });

    describe('GET /social/feed', () => {
        it('should return feed', async () => {
            vi.mocked(prisma.userFollow.findMany).mockResolvedValueOnce([
                { followingId: 2 },
            ] as any);
            vi.mocked(prisma.review.findMany).mockResolvedValueOnce([]);

            const response = await app.inject({
                method: 'GET',
                url: '/api/social/feed',
                headers: { authorization: 'Bearer token' },
            });

            expect(response.statusCode).toBe(200);
            expect(response.json()).toHaveProperty('feed');
        });
    });
});
