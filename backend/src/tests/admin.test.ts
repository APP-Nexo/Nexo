import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { closeApp, startApp } from './tests.setup.js';

const db = vi.hoisted(() => {
    const client = {
        user: {
            count: vi.fn(),
            findUnique: vi.fn(),
            findMany: vi.fn(),
            update: vi.fn(),
        },
        review: {
            count: vi.fn(),
            findMany: vi.fn(),
            findUnique: vi.fn(),
            aggregate: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            groupBy: vi.fn(),
        },
        game: { count: vi.fn(), findMany: vi.fn(), update: vi.fn() },
        blockedUser: { create: vi.fn(), delete: vi.fn() },
        userFollow: { findMany: vi.fn(), deleteMany: vi.fn() },
        userProfile: { updateMany: vi.fn() },
        notification: { create: vi.fn(), deleteMany: vi.fn() },
        report: {
            count: vi.fn(),
            findMany: vi.fn(),
            findUnique: vi.fn(),
            update: vi.fn(),
            updateMany: vi.fn(),
            deleteMany: vi.fn(),
        },
        authSession: { updateMany: vi.fn() },
        adminAuditLog: { create: vi.fn() },
        $transaction: vi.fn(),
    };
    return client;
});

vi.mock('../shared/utils/prisma/prisma_conn.js', () => ({ default: db }));

vi.mock('../shared/middlewares/check_token.js', () => ({
    checkToken: async (req: any) => {
        req.user = {
            sub: '1',
            id: 1,
            email: 'admin@email.com',
            roleId: 999,
            typ: 'access',
            sid: 'session-1',
            jti: 'token-1',
        };
    },
}));

import { app } from '../conf.js';

const now = new Date('2026-08-21T12:00:00.000Z');
let accessRole = 'admin';
let accountUsers = new Map<number, ReturnType<typeof accountUser>>();

function accountUser(id: number, role = 'user', overrides: Record<string, unknown> = {}) {
    return {
        id,
        email: `user${id}@email.com`,
        activate: true,
        deletedAt: null,
        role: { role },
        blockedUser: null,
        ...overrides,
    };
}

function adminUser(id = 2, role = 'user') {
    return {
        id,
        username: `user${id}`,
        email: `user${id}@email.com`,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        activate: true,
        role: { id: role === 'admin' ? 2 : 1, role },
        profile: {
            id,
            friendlyId: `profile-${id}`,
            photo: `https://cdn.test/${id}.png`,
            banner: null,
            config: { theme: 'dark' },
            bio: 'Player',
            followersCount: 3,
            followingCount: 4,
        },
        blockedUser: null,
    };
}

function moderationReview(status: 'pending' | 'approved' | 'rejected' = 'pending') {
    return {
        id: 10,
        userId: 2,
        gameId: 5,
        rating: 4,
        text: 'Review text',
        status,
        moderationReason: status === 'rejected' ? 'Conteúdo impróprio' : null,
        createdAt: now,
        updatedAt: now,
        user: {
            id: 2,
            username: 'player',
            email: 'player@email.com',
            profile: { photo: 'https://cdn.test/player.png' },
        },
        game: { id: 5, title: 'Nexo Game', cover: 'https://cdn.test/game.png' },
        _count: { reports: 1 },
    };
}

function reviewState(overrides: Record<string, unknown> = {}) {
    return {
        id: 10,
        userId: 2,
        gameId: 5,
        rating: 4,
        status: 'approved',
        deletedAt: null,
        user: { activate: true, deletedAt: null, blockedUser: null },
        ...overrides,
    };
}

function pendingReportState(overrides: Record<string, unknown> = {}) {
    return {
        id: 20,
        status: 'pending',
        reviewId: 10,
        reviewVersion: 3,
        review: { ...reviewState(), version: 3 },
        ...overrides,
    };
}

function report(status: 'pending' | 'resolved' | 'rejected' = 'pending') {
    return {
        id: 20,
        reporterId: 3,
        reviewId: 10,
        reason: 'A denúncia possui um motivo válido.',
        reviewRating: 4,
        reviewText: 'Review text',
        reviewCreatedAt: now,
        reviewVersion: 3,
        status,
        resolvedById: status === 'pending' ? null : 1,
        resolutionReason: status === 'pending' ? null : 'Analisado pela moderação',
        resolvedAt: status === 'pending' ? null : now,
        createdAt: now,
        updatedAt: now,
        reporter: {
            id: 3,
            username: 'reporter',
            email: 'reporter@email.com',
            profile: { photo: null },
        },
        review: {
            id: 10,
            userId: 2,
            gameId: 5,
            rating: 4,
            text: 'Review text',
            status: status === 'resolved' ? 'rejected' : 'approved',
            moderationReason: status === 'resolved' ? 'Analisado pela moderação' : null,
            user: { id: 2, username: 'player' },
            game: { id: 5, title: 'Nexo Game', cover: null },
        },
        resolvedBy:
            status === 'pending' ? null : { id: 1, username: 'admin', email: 'admin@email.com' },
    };
}

beforeAll(async () => await startApp());
afterAll(async () => await closeApp());

beforeEach(() => {
    vi.resetAllMocks();
    accessRole = 'admin';
    accountUsers = new Map([
        [1, accountUser(1, 'admin', { email: 'admin@email.com' })],
        [2, accountUser(2)],
    ]);

    db.$transaction.mockImplementation(async (operation: any) => operation(db));
    db.user.findUnique.mockImplementation(async (args: any) => {
        if (args.select?.activate === true && args.select?.id !== true) {
            return {
                activate: true,
                deletedAt: null,
                blockedUser: null,
                role: { role: accessRole },
            };
        }
        return accountUsers.get(args.where.id) ?? null;
    });
    db.user.count.mockResolvedValue(0);
    db.user.findMany.mockResolvedValue([]);
    db.user.update.mockResolvedValue({});
    db.review.count.mockResolvedValue(0);
    db.review.findMany.mockResolvedValue([]);
    db.review.aggregate.mockResolvedValue({ _sum: { rating: null }, _count: 0 });
    db.review.groupBy.mockResolvedValue([]);
    db.review.update.mockResolvedValue(moderationReview());
    db.review.delete.mockResolvedValue({});
    db.game.count.mockResolvedValue(0);
    db.game.findMany.mockResolvedValue([]);
    db.game.update.mockResolvedValue({ ratingSum: 0, ratingCount: 0 });
    db.blockedUser.create.mockResolvedValue({});
    db.blockedUser.delete.mockResolvedValue({});
    db.userFollow.findMany.mockResolvedValue([]);
    db.userFollow.deleteMany.mockResolvedValue({ count: 0 });
    db.userProfile.updateMany.mockResolvedValue({ count: 1 });
    db.notification.create.mockResolvedValue({});
    db.notification.deleteMany.mockResolvedValue({ count: 0 });
    db.report.count.mockResolvedValue(0);
    db.report.findMany.mockResolvedValue([]);
    db.report.update.mockResolvedValue(report('resolved'));
    db.report.updateMany.mockResolvedValue({ count: 0 });
    db.report.deleteMany.mockResolvedValue({ count: 0 });
    db.authSession.updateMany.mockResolvedValue({ count: 1 });
    db.adminAuditLog.create.mockResolvedValue({});
});

describe('Admin authorization and routes', () => {
    it('uses the current database role instead of the JWT roleId', async () => {
        accessRole = 'user';

        const response = await app.inject({
            method: 'GET',
            url: '/api/admin/dashboard',
            headers: { authorization: 'Bearer stale-role-token' },
        });

        expect(response.statusCode).toBe(403);
        expect(db.review.count).not.toHaveBeenCalled();
    });

    it('returns a non-empty full user listing without stripping nested data', async () => {
        db.user.findMany.mockResolvedValueOnce([adminUser()]);

        const response = await app.inject({
            method: 'GET',
            url: '/api/admin/user-all?limit=10',
            headers: { authorization: 'Bearer token' },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json().users).toEqual([
            expect.objectContaining({
                username: 'user2',
                role: { id: 1, role: 'user' },
                profile: expect.objectContaining({ friendlyId: 'profile-2', bio: 'Player' }),
            }),
        ]);
        expect(db.user.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            }),
        );
    });

    it('searches by email or username', async () => {
        db.user.findMany.mockResolvedValueOnce([adminUser()]);

        const response = await app.inject({
            method: 'GET',
            url: '/api/admin/user/search?q=player',
            headers: { authorization: 'Bearer token' },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json().users).toHaveLength(1);
        expect(db.user.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    OR: [
                        { email: { contains: 'player', mode: 'insensitive' } },
                        { username: { contains: 'player', mode: 'insensitive' } },
                    ],
                },
            }),
        );
    });

    it('counts users directly and filters dashboard review metrics to approved reviews', async () => {
        db.user.count.mockResolvedValue(2);
        db.review.count.mockResolvedValue(3);
        db.game.count.mockResolvedValue(1);
        db.report.count.mockResolvedValue(1);
        db.review.groupBy.mockResolvedValue([{ gameId: 5, _count: { gameId: 2 } }]);
        db.game.findMany.mockResolvedValue([
            { id: 5, title: 'Nexo Game', cover: 'https://cdn.test/game.png' },
        ]);

        const dashboard = await app.inject({
            method: 'GET',
            url: '/api/admin/dashboard',
            headers: { authorization: 'Bearer token' },
        });
        const stats = await app.inject({
            method: 'GET',
            url: '/api/admin/user/stats',
            headers: { authorization: 'Bearer token' },
        });

        expect(dashboard.statusCode).toBe(200);
        expect(dashboard.json().topGames).toEqual([
            expect.objectContaining({ id: 5, reviewCount: 2 }),
        ]);
        expect(db.review.groupBy).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    status: 'approved',
                    deletedAt: null,
                    user: { activate: true, deletedAt: null, blockedUser: null },
                },
            }),
        );
        expect(db.review.count).toHaveBeenCalledWith({
            where: {
                status: 'approved',
                deletedAt: null,
                user: { activate: true, deletedAt: null, blockedUser: null },
            },
        });
        expect(stats.statusCode).toBe(200);
        expect(stats.json().usersStatus.totalUsers).toBe(2);
    });

    it.each([
        ['self', 1, 'admin'],
        ['another admin', 2, 'admin'],
        ['a master', 2, 'master'],
    ])('does not let an admin block %s', async (_label, targetId, targetRole) => {
        accountUsers.set(targetId, accountUser(targetId, targetRole));

        const response = await app.inject({
            method: 'POST',
            url: `/api/admin/users/${targetId}/block`,
            headers: { authorization: 'Bearer token' },
            payload: { reason: 'Hierarchy test' },
        });

        expect(response.statusCode).toBe(403);
        expect(db.blockedUser.create).not.toHaveBeenCalled();
        expect(db.authSession.updateMany).not.toHaveBeenCalled();
    });

    it('blocks a regular user, revokes sessions, and writes an audit in one transaction', async () => {
        db.review.findMany.mockResolvedValueOnce([{ gameId: 5 }]);
        db.review.aggregate.mockResolvedValueOnce({ _sum: { rating: 7 }, _count: 2 });
        db.userFollow.findMany.mockResolvedValueOnce([
            { followerId: 2, followingId: 3 },
            { followerId: 4, followingId: 2 },
        ]);

        const response = await app.inject({
            method: 'POST',
            url: '/api/admin/users/2/block',
            headers: { authorization: 'Bearer token' },
            payload: { reason: 'Repeated spam' },
        });

        expect(response.statusCode).toBe(200);
        expect(db.$transaction).toHaveBeenCalledTimes(1);
        expect(db.$transaction).toHaveBeenCalledWith(expect.any(Function), {
            isolationLevel: 'Serializable',
        });
        expect(db.review.findMany).toHaveBeenCalledWith({
            where: { userId: 2, status: 'approved', deletedAt: null },
            select: { gameId: true },
            distinct: ['gameId'],
        });
        expect(db.review.aggregate).toHaveBeenCalledWith({
            where: {
                gameId: 5,
                status: 'approved',
                deletedAt: null,
                user: { activate: true, deletedAt: null, blockedUser: null },
            },
            _sum: { rating: true },
            _count: true,
        });
        expect(db.game.update).toHaveBeenCalledWith({
            where: { id: 5 },
            data: { ratingSum: 7, ratingCount: 2, averageRating: 3.5 },
        });
        expect(db.userFollow.deleteMany).toHaveBeenCalledWith({
            where: { OR: [{ followerId: 2 }, { followingId: 2 }] },
        });
        expect(db.userProfile.updateMany).toHaveBeenNthCalledWith(1, {
            where: { userId: { in: [3] }, followersCount: { gt: 0 } },
            data: { followersCount: { decrement: 1 } },
        });
        expect(db.userProfile.updateMany).toHaveBeenNthCalledWith(2, {
            where: { userId: { in: [4] }, followingCount: { gt: 0 } },
            data: { followingCount: { decrement: 1 } },
        });
        expect(db.userProfile.updateMany).toHaveBeenNthCalledWith(3, {
            where: { userId: 2 },
            data: { followersCount: 0, followingCount: 0 },
        });
        expect(db.notification.deleteMany).toHaveBeenCalledWith({
            where: {
                type: 'follow',
                OR: [{ toUserId: 2 }, { fromUserId: 2 }],
            },
        });
        expect(db.authSession.updateMany).toHaveBeenCalledWith({
            where: { userId: 2, revokedAt: null },
            data: { revokedAt: expect.any(Date) },
        });
        expect(db.adminAuditLog.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                actorId: 1,
                targetUserId: 2,
                action: 'user.block',
            }),
        });
    });

    it('returns non-empty moderation reviews with nested user and game data', async () => {
        db.review.findMany.mockResolvedValueOnce([moderationReview()]);

        const response = await app.inject({
            method: 'GET',
            url: '/api/admin/reviews?status=pending',
            headers: { authorization: 'Bearer token' },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json().reviews[0]).toEqual(
            expect.objectContaining({
                user: expect.objectContaining({ username: 'player' }),
                game: expect.objectContaining({ title: 'Nexo Game' }),
                _count: { reports: 1 },
            }),
        );
        expect(db.review.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: { status: 'pending', deletedAt: null } }),
        );
    });

    it('rejects an approved review and removes it from game aggregates', async () => {
        db.review.findUnique.mockResolvedValueOnce(reviewState());
        db.review.update.mockResolvedValueOnce(moderationReview('rejected'));
        db.game.update
            .mockResolvedValueOnce({ ratingSum: 6, ratingCount: 2 })
            .mockResolvedValueOnce({});

        const response = await app.inject({
            method: 'PATCH',
            url: '/api/admin/reviews/10/moderation',
            headers: { authorization: 'Bearer token' },
            payload: { action: 'reject', reason: 'Conteúdo impróprio' },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json().review.status).toBe('rejected');
        expect(db.game.update).toHaveBeenNthCalledWith(1, {
            where: { id: 5 },
            data: { ratingSum: { decrement: 4 }, ratingCount: { decrement: 1 } },
            select: { ratingSum: true, ratingCount: true },
        });
        expect(db.game.update).toHaveBeenNthCalledWith(2, {
            where: { id: 5 },
            data: { averageRating: 3 },
        });
        expect(db.adminAuditLog.create).toHaveBeenCalledWith({
            data: expect.objectContaining({ action: 'review.reject', targetUserId: 2 }),
        });
        expect(db.notification.create).toHaveBeenCalledWith({
            data: {
                type: 'moderation',
                toUserId: 2,
                fromUserId: 1,
                entityType: 'review',
                entityId: 10,
                metadata: { action: 'reject', reason: 'Conteúdo impróprio' },
            },
        });
    });

    it('does not add an already-approved review to aggregates again', async () => {
        db.review.findUnique.mockResolvedValueOnce(reviewState());
        db.review.update.mockResolvedValueOnce(moderationReview('approved'));

        const response = await app.inject({
            method: 'PATCH',
            url: '/api/admin/reviews/10/moderation',
            headers: { authorization: 'Bearer token' },
            payload: { action: 'approve' },
        });

        expect(response.statusCode).toBe(200);
        expect(db.game.update).not.toHaveBeenCalled();
    });

    it('adds a non-approved review to aggregates when approving it', async () => {
        db.review.findUnique.mockResolvedValueOnce(reviewState({ status: 'rejected' }));
        db.review.update.mockResolvedValueOnce(moderationReview('approved'));
        db.game.update
            .mockResolvedValueOnce({ ratingSum: 10, ratingCount: 3 })
            .mockResolvedValueOnce({});

        const response = await app.inject({
            method: 'PATCH',
            url: '/api/admin/reviews/10/moderation',
            headers: { authorization: 'Bearer token' },
            payload: { action: 'approve', reason: 'Conteúdo revisado' },
        });

        expect(response.statusCode).toBe(200);
        expect(db.game.update).toHaveBeenNthCalledWith(1, {
            where: { id: 5 },
            data: { ratingSum: { increment: 4 }, ratingCount: { increment: 1 } },
            select: { ratingSum: true, ratingCount: true },
        });
        expect(db.game.update).toHaveBeenNthCalledWith(2, {
            where: { id: 5 },
            data: { averageRating: 10 / 3 },
        });
        expect(db.notification.create).toHaveBeenCalledWith({
            data: {
                type: 'moderation',
                toUserId: 2,
                fromUserId: 1,
                entityType: 'review',
                entityId: 10,
                metadata: { action: 'approve', reason: 'Conteúdo revisado' },
            },
        });
    });

    it('soft-deletes a review, resolves pending reports, adjusts aggregates, and audits', async () => {
        db.review.findUnique.mockResolvedValueOnce(reviewState());
        db.report.updateMany.mockResolvedValueOnce({ count: 2 });
        db.game.update
            .mockResolvedValueOnce({ ratingSum: 0, ratingCount: 0 })
            .mockResolvedValueOnce({});

        const response = await app.inject({
            method: 'DELETE',
            url: '/api/admin/reviews/10',
            headers: { authorization: 'Bearer token' },
        });

        expect(response.statusCode).toBe(200);
        expect(db.report.updateMany).toHaveBeenCalledWith({
            where: { reviewId: 10, status: 'pending' },
            data: {
                status: 'resolved',
                resolvedById: 1,
                resolutionReason: 'Review removida por moderação.',
                resolvedAt: expect.any(Date),
            },
        });
        const resolvedAt = db.report.updateMany.mock.calls[0]![0].data.resolvedAt;
        expect(db.review.update).toHaveBeenCalledWith({
            where: { id: 10 },
            data: {
                status: 'rejected',
                moderationReason: 'Review removida por moderação.',
                deletedAt: resolvedAt,
            },
        });
        expect(db.report.deleteMany).not.toHaveBeenCalled();
        expect(db.review.delete).not.toHaveBeenCalled();
        expect(db.game.update).toHaveBeenNthCalledWith(1, {
            where: { id: 5 },
            data: { ratingSum: { decrement: 4 }, ratingCount: { decrement: 1 } },
            select: { ratingSum: true, ratingCount: true },
        });
        expect(db.game.update).toHaveBeenNthCalledWith(2, {
            where: { id: 5 },
            data: { averageRating: 0 },
        });
        expect(db.adminAuditLog.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                action: 'review.delete',
                metadata: expect.objectContaining({ resolvedReports: 2 }),
            }),
        });
    });

    it('returns non-empty reports without stripping reporter, review, or game data', async () => {
        db.report.findMany.mockResolvedValueOnce([report()]);

        const response = await app.inject({
            method: 'GET',
            url: '/api/admin/reports',
            headers: { authorization: 'Bearer token' },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json().reports[0]).toEqual(
            expect.objectContaining({
                reviewRating: 4,
                reviewText: 'Review text',
                reviewCreatedAt: now.toISOString(),
                reviewVersion: 3,
                reporter: expect.objectContaining({ username: 'reporter' }),
                review: expect.objectContaining({
                    user: { id: 2, username: 'player' },
                    game: expect.objectContaining({ title: 'Nexo Game' }),
                }),
            }),
        );
    });

    it('resolves a report, rejects its approved review, sets the resolver, and audits both', async () => {
        db.report.findUnique.mockResolvedValueOnce(pendingReportState());
        db.report.update.mockResolvedValueOnce(report('resolved'));
        db.game.update
            .mockResolvedValueOnce({ ratingSum: 6, ratingCount: 2 })
            .mockResolvedValueOnce({});

        const response = await app.inject({
            method: 'PATCH',
            url: '/api/admin/reports/20',
            headers: { authorization: 'Bearer token' },
            payload: {
                status: 'resolved',
                action: 'reject_review',
                reason: 'Analisado pela moderação',
            },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json().report.resolvedBy).toEqual(
            expect.objectContaining({ id: 1, username: 'admin' }),
        );
        expect(db.report.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    status: 'resolved',
                    resolvedById: 1,
                    resolutionReason: 'Analisado pela moderação',
                }),
            }),
        );
        expect(db.adminAuditLog.create).toHaveBeenCalledTimes(2);
        expect(db.adminAuditLog.create).toHaveBeenCalledWith({
            data: expect.objectContaining({ action: 'report.resolve', targetUserId: 2 }),
        });
        expect(db.notification.create).toHaveBeenCalledWith({
            data: {
                type: 'moderation',
                toUserId: 2,
                fromUserId: 1,
                entityType: 'report',
                entityId: 20,
                metadata: { status: 'resolved', action: 'reject_review' },
            },
        });
    });

    it('rejects a report action when its immutable review version is stale', async () => {
        db.report.findUnique.mockResolvedValueOnce(
            pendingReportState({
                reviewVersion: 2,
                review: { ...reviewState(), version: 3 },
            }),
        );

        const response = await app.inject({
            method: 'PATCH',
            url: '/api/admin/reports/20',
            headers: { authorization: 'Bearer token' },
            payload: {
                status: 'resolved',
                action: 'reject_review',
                reason: 'Conteúdo desatualizado',
            },
        });

        expect(response.statusCode).toBe(409);
        expect(db.review.update).not.toHaveBeenCalled();
        expect(db.report.update).not.toHaveBeenCalled();
        expect(db.adminAuditLog.create).not.toHaveBeenCalled();
        expect(db.notification.create).not.toHaveBeenCalled();
    });

    it('keeps the documented resolve route as a bodyless alias', async () => {
        db.report.findUnique.mockResolvedValueOnce(pendingReportState());
        db.report.update.mockResolvedValueOnce(report('resolved'));

        const response = await app.inject({
            method: 'PATCH',
            url: '/api/admin/reports/20/resolve',
            headers: { authorization: 'Bearer token' },
        });

        expect(response.statusCode).toBe(200);
        expect(db.report.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ status: 'resolved', resolvedById: 1 }),
            }),
        );
    });

    it('rejects invalid moderation and report combinations with 400', async () => {
        const moderation = await app.inject({
            method: 'PATCH',
            url: '/api/admin/reviews/10/moderation',
            headers: { authorization: 'Bearer token' },
            payload: { action: 'reject' },
        });
        const reportResponse = await app.inject({
            method: 'PATCH',
            url: '/api/admin/reports/20',
            headers: { authorization: 'Bearer token' },
            payload: { status: 'rejected', action: 'reject_review', reason: 'Invalid action' },
        });

        expect(moderation.statusCode).toBe(400);
        expect(reportResponse.statusCode).toBe(400);
        expect(db.review.update).not.toHaveBeenCalled();
    });
});
