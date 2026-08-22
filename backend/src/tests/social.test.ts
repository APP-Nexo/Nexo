import fastify, { type FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => {
    const user = { findUnique: vi.fn(), count: vi.fn() };
    const userFollow = {
        createMany: vi.fn(),
        deleteMany: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
    };
    const userProfile = { update: vi.fn(), updateMany: vi.fn() };
    const notification = { create: vi.fn(), deleteMany: vi.fn() };
    const review = { findMany: vi.fn() };
    const tx = { user, userFollow, userProfile, notification };
    const transaction = vi.fn(async (operation: (client: typeof tx) => Promise<unknown>) =>
        operation(tx),
    );

    return { user, userFollow, userProfile, notification, review, tx, transaction };
});

vi.mock('../shared/utils/prisma/prisma_conn.js', () => ({
    default: {
        user: db.user,
        userFollow: db.userFollow,
        userProfile: db.userProfile,
        notification: db.notification,
        review: db.review,
        $transaction: db.transaction,
    },
}));

vi.mock('../shared/middlewares/check_token.js', () => ({
    checkToken: async (request: any) => {
        request.user = { id: 1, email: 'viewer@nexo.test', roleId: 1 };
    },
}));

import { socialRoutes } from '../modules/social/social.routes.js';
import { errorHandler } from '../shared/errors/error_handler.js';

const timestamp = new Date('2026-08-21T12:00:00.000Z');

function activeUser(id = 2, username = 'other') {
    return {
        id,
        username,
        activate: true,
        deletedAt: null,
        blockedUser: null,
    };
}

function reviewRecord() {
    return {
        id: 30,
        userId: 4,
        gameId: 10,
        rating: 5,
        text: 'Excelente',
        status: 'approved',
        createdAt: timestamp,
        user: {
            id: 4,
            username: 'discoverable',
            profile: { photo: '/avatars/4.png' },
        },
        game: { id: 10, title: 'Nexo Quest', cover: '/covers/10.jpg' },
    };
}

let app: FastifyInstance;

beforeAll(async () => {
    app = fastify({ logger: false });
    app.setErrorHandler(errorHandler);
    await app.register(socialRoutes, { prefix: '/api/social' });
    await app.ready();
});

afterAll(async () => {
    await app.close();
});

beforeEach(() => {
    vi.clearAllMocks();
    db.user.count.mockResolvedValue(2);
    db.userFollow.count.mockResolvedValue(0);
    db.userProfile.update.mockResolvedValue({});
    db.userProfile.updateMany.mockResolvedValue({ count: 1 });
    db.notification.create.mockResolvedValue({});
    db.notification.deleteMany.mockResolvedValue({ count: 1 });
});

describe('Social routes', () => {
    it('creates one follow, updates both counters, and creates one typed notification', async () => {
        db.user.findUnique.mockResolvedValueOnce(activeUser());
        db.userFollow.createMany.mockResolvedValueOnce({ count: 1 });

        const response = await app.inject({
            method: 'POST',
            url: '/api/social/other/follow',
            headers: { authorization: 'Bearer token' },
        });

        expect(response.statusCode).toBe(201);
        expect(response.json()).toEqual({ message: 'Você começou a seguir other.' });
        expect(db.user.count).toHaveBeenCalledWith({
            where: {
                id: { in: [1, 2] },
                activate: true,
                deletedAt: null,
                blockedUser: null,
            },
        });
        expect(db.userFollow.createMany).toHaveBeenCalledWith({
            data: { followerId: 1, followingId: 2 },
            skipDuplicates: true,
        });
        expect(db.userProfile.update).toHaveBeenNthCalledWith(1, {
            where: { userId: 1 },
            data: { followingCount: { increment: 1 } },
        });
        expect(db.userProfile.update).toHaveBeenNthCalledWith(2, {
            where: { userId: 2 },
            data: { followersCount: { increment: 1 } },
        });
        expect(db.notification.create).toHaveBeenCalledWith({
            data: {
                type: 'follow',
                toUserId: 2,
                fromUserId: 1,
                entityType: 'user',
                entityId: 1,
                metadata: { followerId: 1 },
            },
        });
        expect(db.transaction).toHaveBeenCalledWith(expect.any(Function), {
            isolationLevel: 'Serializable',
        });
    });

    it('is idempotent when the follow relation already exists', async () => {
        db.user.findUnique.mockResolvedValueOnce(activeUser());
        db.userFollow.createMany.mockResolvedValueOnce({ count: 0 });

        const response = await app.inject({
            method: 'POST',
            url: '/api/social/other/follow',
            headers: { authorization: 'Bearer token' },
        });

        expect(response.statusCode).toBe(201);
        expect(db.userProfile.update).not.toHaveBeenCalled();
        expect(db.notification.create).not.toHaveBeenCalled();
    });

    it('rechecks both active accounts in the transaction before creating a follow', async () => {
        db.user.findUnique.mockResolvedValueOnce(activeUser());
        db.user.count.mockResolvedValueOnce(1);

        const response = await app.inject({
            method: 'POST',
            url: '/api/social/other/follow',
            headers: { authorization: 'Bearer token' },
        });

        expect(response.statusCode).toBe(409);
        expect(db.user.count).toHaveBeenCalledWith({
            where: {
                id: { in: [1, 2] },
                activate: true,
                deletedAt: null,
                blockedUser: null,
            },
        });
        expect(db.userFollow.createMany).not.toHaveBeenCalled();
        expect(db.userProfile.update).not.toHaveBeenCalled();
        expect(db.notification.create).not.toHaveBeenCalled();
    });

    it('rejects an inactive follow target before opening a transaction', async () => {
        db.user.findUnique.mockResolvedValueOnce({
            ...activeUser(),
            activate: false,
        });

        const response = await app.inject({
            method: 'POST',
            url: '/api/social/other/follow',
            headers: { authorization: 'Bearer token' },
        });

        expect(response.statusCode).toBe(404);
        expect(db.transaction).not.toHaveBeenCalled();
    });

    it('unfollows with guarded decrements and removes only unread follow notifications', async () => {
        db.user.findUnique.mockResolvedValueOnce({ id: 2, username: 'other' });
        db.userFollow.deleteMany.mockResolvedValueOnce({ count: 1 });

        const response = await app.inject({
            method: 'DELETE',
            url: '/api/social/other/follow',
            headers: { authorization: 'Bearer token' },
        });

        expect(response.statusCode).toBe(200);
        expect(db.userProfile.updateMany).toHaveBeenNthCalledWith(1, {
            where: { userId: 1, followingCount: { gt: 0 } },
            data: { followingCount: { decrement: 1 } },
        });
        expect(db.userProfile.updateMany).toHaveBeenNthCalledWith(2, {
            where: { userId: 2, followersCount: { gt: 0 } },
            data: { followersCount: { decrement: 1 } },
        });
        expect(db.notification.deleteMany).toHaveBeenCalledWith({
            where: {
                type: 'follow',
                toUserId: 2,
                fromUserId: 1,
                read: false,
            },
        });
    });

    it('preserves follow ordering and serializes complete follower objects', async () => {
        db.user.findUnique.mockResolvedValueOnce(activeUser());
        db.userFollow.findMany
            .mockResolvedValueOnce([
                {
                    id: 20,
                    followerId: 4,
                    follower: {
                        id: 4,
                        username: 'newer',
                        profile: { photo: '/avatars/4.png' },
                    },
                },
                {
                    id: 19,
                    followerId: 3,
                    follower: { id: 3, username: 'older', profile: { photo: null } },
                },
            ])
            .mockResolvedValueOnce([{ followingId: 3 }]);

        const response = await app.inject({
            method: 'GET',
            url: '/api/social/other/followers',
            headers: { authorization: 'Bearer token' },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({
            followers: [
                {
                    id: 4,
                    username: 'newer',
                    photo: '/avatars/4.png',
                    isFollowing: false,
                },
                { id: 3, username: 'older', photo: null, isFollowing: true },
            ],
            nextCursor: null,
        });
        expect(db.userFollow.findMany).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                where: expect.objectContaining({
                    followingId: 2,
                    follower: { activate: true, deletedAt: null, blockedUser: null },
                }),
                orderBy: [{ timestamp: 'desc' }, { id: 'desc' }],
            }),
        );
    });

    it('uses approved reviews from active users as discovery when no one is followed', async () => {
        db.review.findMany.mockResolvedValueOnce([reviewRecord()]);

        const response = await app.inject({
            method: 'GET',
            url: '/api/social/feed?cursor=55',
            headers: { authorization: 'Bearer token' },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({
            feed: [
                {
                    id: 30,
                    type: 'review',
                    userId: 4,
                    userUsername: 'discoverable',
                    userPhoto: '/avatars/4.png',
                    createdAt: timestamp.toISOString(),
                    review: {
                        id: 30,
                        gameId: 10,
                        gameTitle: 'Nexo Quest',
                        gameCover: '/covers/10.jpg',
                        rating: 5,
                        text: 'Excelente',
                    },
                },
            ],
            nextCursor: null,
        });
        expect(db.userFollow.count).toHaveBeenCalledWith({
            where: {
                followerId: 1,
                following: { activate: true, deletedAt: null, blockedUser: null },
            },
        });
        expect(db.review.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                cursor: { id: 55 },
                skip: 1,
                where: {
                    status: 'approved',
                    deletedAt: null,
                    user: { activate: true, deletedAt: null, blockedUser: null },
                    userId: { not: 1 },
                },
                orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            }),
        );
    });
});
