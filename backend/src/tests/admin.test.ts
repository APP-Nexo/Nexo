import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { closeApp, startApp } from './tests.setup.js';

vi.mock('../shared/utils/prisma/prisma_conn.js', () => ({
    default: {
        user: { count: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn() },
        review: {
            count: vi.fn(),
            findMany: vi.fn(),
            findUnique: vi.fn(),
            delete: vi.fn(),
            groupBy: vi.fn(),
        },
        game: { count: vi.fn(), findMany: vi.fn() },
        blockedUser: { findUnique: vi.fn(), create: vi.fn(), delete: vi.fn() },
        report: { count: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
        role: { findUnique: vi.fn() },
        vwUsersStatusSummary: { findFirst: vi.fn() },
        vwUserPublic: { findMany: vi.fn() },
        oAuthAccount: { findFirst: vi.fn() },
    },
}));

vi.mock('../shared/middlewares/check_token.js', () => ({
    checkToken: async (req: any, _reply: any) => {
        req.user = { id: 1, name: 'Admin User', email: 'admin@email.com', roleId: 2 };
    },
}));

vi.mock('../shared/utils/jwt/jwt_token.js', () => ({
    JwtToken: { getByUser: vi.fn().mockResolvedValue({ id: 1, roleId: 2 }) },
}));

vi.mock('../shared/middlewares/check_acess_perm.js', () => ({
    checkAccessPerm: async (_req: any, _reply: any) => {},
}));

import { app } from '../conf.js';
import prisma from '../shared/utils/prisma/prisma_conn.js';

beforeAll(async () => await startApp());
afterAll(async () => await closeApp());

beforeEach(() => {
    vi.clearAllMocks();
});

describe('Admin Routes', () => {
    describe('GET /admin/dashboard', () => {
        it('should return dashboard metrics', async () => {
            vi.mocked(prisma.user.count).mockResolvedValue(10);
            vi.mocked(prisma.review.count).mockResolvedValue(20);
            vi.mocked(prisma.game.count).mockResolvedValue(5);
            vi.mocked(prisma.review.groupBy).mockResolvedValue([]);
            vi.mocked(prisma.game.findMany).mockResolvedValue([]);

            const response = await app.inject({
                method: 'GET',
                url: '/api/admin/dashboard',
                headers: { authorization: 'Bearer token' },
            });

            expect(response.statusCode).toBe(200);
            const body = response.json();
            expect(body).toHaveProperty('totalUsers');
            expect(body).toHaveProperty('totalReviews');
            expect(body).toHaveProperty('recentActivity');
        });
    });

    describe('GET /admin/users/:id', () => {
        it('should return user details', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
                id: 2,
                name: 'Test',
                email: 'test@email.com',
                username: 'test',
                roleId: 1,
                activate: true,
                createdAt: new Date(),
                password: 'hash',
                deletedAt: null,
                blockedUser: null,
                profile: { photo: null, bio: null, followersCount: 0, followingCount: 0 },
                reviews: [],
            } as any);

            const response = await app.inject({
                method: 'GET',
                url: '/api/admin/users/2',
                headers: { authorization: 'Bearer token' },
            });

            expect(response.statusCode).toBe(200);
            expect(response.json()).toHaveProperty('name', 'Test');
        });
    });

    describe('POST /admin/users/:id/block', () => {
        it('should block a user', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ id: 2 } as any);
            vi.mocked(prisma.blockedUser.findUnique).mockResolvedValueOnce(null);
            vi.mocked(prisma.blockedUser.create).mockResolvedValueOnce({} as any);

            const response = await app.inject({
                method: 'POST',
                url: '/api/admin/users/2/block',
                headers: { authorization: 'Bearer token' },
                payload: { reason: 'Spam' },
            });

            expect(response.statusCode).toBe(200);
        });
    });

    describe('DELETE /admin/users/:id/block', () => {
        it('should unblock a user', async () => {
            vi.mocked(prisma.blockedUser.findUnique).mockResolvedValueOnce({ userId: 2 } as any);
            vi.mocked(prisma.blockedUser.delete).mockResolvedValueOnce({} as any);

            const response = await app.inject({
                method: 'DELETE',
                url: '/api/admin/users/2/block',
                headers: { authorization: 'Bearer token' },
            });

            expect(response.statusCode).toBe(200);
        });
    });

    describe('GET /admin/reviews', () => {
        it('should return reviews for moderation', async () => {
            vi.mocked(prisma.review.findMany).mockResolvedValueOnce([]);

            const response = await app.inject({
                method: 'GET',
                url: '/api/admin/reviews',
                headers: { authorization: 'Bearer token' },
            });

            expect(response.statusCode).toBe(200);
        });
    });

    describe('DELETE /admin/reviews/:id', () => {
        it('should delete a review', async () => {
            vi.mocked(prisma.review.findUnique).mockResolvedValueOnce({ id: 1 } as any);
            vi.mocked(prisma.review.delete).mockResolvedValueOnce({} as any);

            const response = await app.inject({
                method: 'DELETE',
                url: '/api/admin/reviews/1',
                headers: { authorization: 'Bearer token' },
            });

            expect(response.statusCode).toBe(200);
        });
    });

    describe('GET /admin/reports', () => {
        it('should return pending reports', async () => {
            vi.mocked(prisma.report.findMany).mockResolvedValueOnce([]);

            const response = await app.inject({
                method: 'GET',
                url: '/api/admin/reports',
                headers: { authorization: 'Bearer token' },
            });

            expect(response.statusCode).toBe(200);
        });
    });
});
