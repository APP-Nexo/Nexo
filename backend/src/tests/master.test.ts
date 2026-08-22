import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { closeApp, startApp } from './tests.setup.js';

const db = vi.hoisted(() => {
    const client = {
        user: { findUnique: vi.fn(), update: vi.fn() },
        userProfile: { updateMany: vi.fn() },
        role: { findUnique: vi.fn() },
        review: { findMany: vi.fn(), aggregate: vi.fn() },
        game: { update: vi.fn() },
        userFollow: { findMany: vi.fn(), deleteMany: vi.fn() },
        notification: { deleteMany: vi.fn() },
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
            email: 'master@email.com',
            roleId: 1,
            typ: 'access',
            sid: 'session-1',
            jti: 'token-1',
        };
    },
}));

import { app } from '../conf.js';

let accessRole = 'master';
let targetUsers = new Map<number, ReturnType<typeof targetUser>>();

function targetUser(id: number, role = 'user', overrides: Record<string, unknown> = {}) {
    return {
        id,
        email: `user${id}@email.com`,
        activate: true,
        deletedAt: null,
        blockedUser: null,
        role: { role },
        ...overrides,
    };
}

beforeAll(async () => await startApp());
afterAll(async () => await closeApp());

beforeEach(() => {
    vi.resetAllMocks();
    accessRole = 'master';
    targetUsers = new Map([
        [1, targetUser(1, 'master', { email: 'master@email.com' })],
        [2, targetUser(2)],
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
        return targetUsers.get(args.where.id) ?? null;
    });
    db.user.update.mockResolvedValue({});
    db.userProfile.updateMany.mockResolvedValue({ count: 1 });
    db.role.findUnique.mockImplementation(async (args: any) => ({
        id: args.where.role === 'admin' ? 2 : 1,
    }));
    db.review.findMany.mockResolvedValue([]);
    db.review.aggregate.mockResolvedValue({ _sum: { rating: null }, _count: 0 });
    db.game.update.mockResolvedValue({});
    db.userFollow.findMany.mockResolvedValue([]);
    db.userFollow.deleteMany.mockResolvedValue({ count: 0 });
    db.notification.deleteMany.mockResolvedValue({ count: 0 });
    db.authSession.updateMany.mockResolvedValue({ count: 2 });
    db.adminAuditLog.create.mockResolvedValue({});
});

describe('Master authorization and routes', () => {
    it('uses the current database role instead of the JWT roleId', async () => {
        accessRole = 'admin';

        const response = await app.inject({
            method: 'PATCH',
            url: '/api/master/user/2/promote',
            headers: { authorization: 'Bearer stale-role-token' },
        });

        expect(response.statusCode).toBe(403);
        expect(db.$transaction).not.toHaveBeenCalled();
    });

    it('promotes a user by role name and audits the mutation', async () => {
        const response = await app.inject({
            method: 'PATCH',
            url: '/api/master/user/2/promote',
            headers: { authorization: 'Bearer token' },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({
            message: 'Usuário promovido para admin.',
            email: 'user2@email.com',
            role: 'admin',
        });
        expect(db.role.findUnique).toHaveBeenCalledWith({
            where: { role: 'admin' },
            select: { id: true },
        });
        expect(db.adminAuditLog.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                actorId: 1,
                targetUserId: 2,
                action: 'user.promote',
                metadata: { previousRole: 'user', newRole: 'admin' },
            }),
        });
    });

    it('does not let a master demote itself', async () => {
        const response = await app.inject({
            method: 'PATCH',
            url: '/api/master/user/1/demote',
            headers: { authorization: 'Bearer token' },
        });

        expect(response.statusCode).toBe(403);
        expect(db.$transaction).not.toHaveBeenCalled();
        expect(db.user.update).not.toHaveBeenCalled();
    });

    it('can demote another master and revokes that account sessions', async () => {
        targetUsers.set(2, targetUser(2, 'master'));

        const response = await app.inject({
            method: 'PATCH',
            url: '/api/master/user/2/demote',
            headers: { authorization: 'Bearer token' },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json().role).toBe('user');
        expect(db.role.findUnique).toHaveBeenCalledWith({
            where: { role: 'user' },
            select: { id: true },
        });
        expect(db.authSession.updateMany).toHaveBeenCalledWith({
            where: { userId: 2, revokedAt: null },
            data: { revokedAt: expect.any(Date) },
        });
        expect(db.adminAuditLog.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                action: 'user.demote',
                metadata: expect.objectContaining({
                    previousRole: 'master',
                    revokedSessions: 2,
                }),
            }),
        });
    });

    it('does not let a master ban itself', async () => {
        const response = await app.inject({
            method: 'PATCH',
            url: '/api/master/user/1/ban',
            headers: { authorization: 'Bearer token' },
        });

        expect(response.statusCode).toBe(403);
        expect(db.user.update).not.toHaveBeenCalled();
    });

    it('does not let a master ban another master', async () => {
        targetUsers.set(2, targetUser(2, 'master'));

        const response = await app.inject({
            method: 'PATCH',
            url: '/api/master/user/2/ban',
            headers: { authorization: 'Bearer token' },
        });

        expect(response.statusCode).toBe(403);
        expect(db.user.update).not.toHaveBeenCalled();
        expect(db.authSession.updateMany).not.toHaveBeenCalled();
    });

    it('bans an admin, revokes sessions, and audits the mutation', async () => {
        targetUsers.set(2, targetUser(2, 'admin', { email: 'admin2@email.com' }));
        db.review.findMany.mockResolvedValueOnce([{ gameId: 5 }]);
        db.review.aggregate.mockResolvedValueOnce({ _sum: { rating: 9 }, _count: 3 });
        db.userFollow.findMany.mockResolvedValueOnce([
            { followerId: 2, followingId: 3 },
            { followerId: 4, followingId: 2 },
        ]);

        const response = await app.inject({
            method: 'PATCH',
            url: '/api/master/user/2/ban',
            headers: { authorization: 'Bearer token' },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual(
            expect.objectContaining({ email: 'admin2@email.com', bannedAt: expect.any(String) }),
        );
        expect(db.user.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 2 },
                data: expect.objectContaining({
                    activate: false,
                    deletedAt: expect.any(Date),
                }),
            }),
        );
        const anonymized = db.user.update.mock.calls[0]![0].data;
        expect(anonymized.username).toMatch(/^banned_2_[0-9a-f-]{36}$/);
        expect(anonymized.email).toBe(
            `banned-2-${anonymized.username.slice('banned_2_'.length)}@deleted.invalid`,
        );
        expect(db.userProfile.updateMany).toHaveBeenCalledWith({
            where: { userId: 2 },
            data: { photo: null, banner: null, bio: null },
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
            data: { ratingSum: 9, ratingCount: 3, averageRating: 3 },
        });
        expect(db.userFollow.deleteMany).toHaveBeenCalledWith({
            where: { OR: [{ followerId: 2 }, { followingId: 2 }] },
        });
        expect(db.userProfile.updateMany).toHaveBeenNthCalledWith(2, {
            where: { userId: { in: [3] }, followersCount: { gt: 0 } },
            data: { followersCount: { decrement: 1 } },
        });
        expect(db.userProfile.updateMany).toHaveBeenNthCalledWith(3, {
            where: { userId: { in: [4] }, followingCount: { gt: 0 } },
            data: { followingCount: { decrement: 1 } },
        });
        expect(db.userProfile.updateMany).toHaveBeenNthCalledWith(4, {
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
                action: 'user.ban',
                metadata: expect.objectContaining({ previousRole: 'admin', revokedSessions: 2 }),
            }),
        });
    });

    it('returns normalized validation errors for invalid ids', async () => {
        const response = await app.inject({
            method: 'PATCH',
            url: '/api/master/user/0/ban',
            headers: { authorization: 'Bearer token' },
        });

        expect(response.statusCode).toBe(400);
        expect(db.$transaction).not.toHaveBeenCalled();
    });
});
