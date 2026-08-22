import fastify, { type FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
    notification: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        count: vi.fn(),
        updateMany: vi.fn(),
        deleteMany: vi.fn(),
    },
}));

vi.mock('../shared/utils/prisma/prisma_conn.js', () => ({
    default: { notification: db.notification },
}));

vi.mock('../shared/middlewares/check_token.js', () => ({
    checkToken: async (request: any) => {
        request.user = { id: 1, email: 'recipient@nexo.test', roleId: 1 };
    },
}));

import { notificationRoutes } from '../modules/notification/notification.routes.js';
import { errorHandler } from '../shared/errors/error_handler.js';

const timestamp = new Date('2026-08-21T12:00:00.000Z');

function followNotification() {
    return {
        id: 9,
        type: 'follow',
        read: false,
        readAt: null,
        entityType: 'user',
        entityId: 2,
        metadata: { followerId: 2 },
        createdAt: timestamp,
        toUserId: 1,
        fromUserId: 2,
        fromUser: {
            id: 2,
            username: 'follower',
            profile: { photo: '/avatars/2.png' },
        },
    };
}

let app: FastifyInstance;

beforeAll(async () => {
    app = fastify({ logger: false });
    app.setErrorHandler(errorHandler);
    await app.register(notificationRoutes, { prefix: '/api/notification' });
    await app.ready();
});

afterAll(async () => {
    await app.close();
});

beforeEach(() => {
    vi.clearAllMocks();
});

describe('Notification routes', () => {
    it('returns complete typed notifications, an optional actor, and unread count', async () => {
        db.notification.findMany.mockResolvedValueOnce([
            followNotification(),
            {
                id: 8,
                type: 'system',
                read: true,
                readAt: timestamp,
                entityType: null,
                entityId: null,
                metadata: null,
                createdAt: timestamp,
                toUserId: 1,
                fromUserId: null,
                fromUser: null,
            },
        ]);
        db.notification.count.mockResolvedValueOnce(4).mockResolvedValueOnce(1);

        const response = await app.inject({
            method: 'GET',
            url: '/api/notification',
            headers: { authorization: 'Bearer token' },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({
            notifications: [
                {
                    id: 9,
                    type: 'follow',
                    read: false,
                    readAt: null,
                    entityType: 'user',
                    entityId: 2,
                    metadata: { followerId: 2 },
                    createdAt: timestamp.toISOString(),
                    toUserId: 1,
                    fromUserId: 2,
                    fromUser: {
                        id: 2,
                        username: 'follower',
                        photo: '/avatars/2.png',
                    },
                },
                {
                    id: 8,
                    type: 'system',
                    read: true,
                    readAt: timestamp.toISOString(),
                    entityType: null,
                    entityId: null,
                    metadata: null,
                    createdAt: timestamp.toISOString(),
                    toUserId: 1,
                    fromUserId: null,
                    fromUser: null,
                },
            ],
            nextCursor: null,
            total: 4,
            unreadCount: 1,
        });
        expect(db.notification.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { toUserId: 1 },
                orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
                take: 11,
            }),
        );
        expect(db.notification.count).toHaveBeenNthCalledWith(2, {
            where: { toUserId: 1, read: false },
        });
    });

    it('keeps read-all idempotent and records readAt', async () => {
        db.notification.updateMany.mockResolvedValueOnce({ count: 0 });

        const response = await app.inject({
            method: 'PATCH',
            url: '/api/notification/read-all',
            headers: { authorization: 'Bearer token' },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({ message: 'Todas notificações marcadas como lidas.' });
        expect(db.notification.updateMany).toHaveBeenCalledWith({
            where: { toUserId: 1, read: false },
            data: { read: true, readAt: expect.any(Date) },
        });
        expect(db.notification.count).not.toHaveBeenCalled();
    });

    it('marks one owned notification as read on the new compatibility-safe route', async () => {
        db.notification.findFirst.mockResolvedValueOnce({ id: 9, toUserId: 1, read: false });
        db.notification.updateMany.mockResolvedValueOnce({ count: 1 });

        const response = await app.inject({
            method: 'PATCH',
            url: '/api/notification/9/read',
            headers: { authorization: 'Bearer token' },
        });

        expect(response.statusCode).toBe(200);
        expect(db.notification.findFirst).toHaveBeenCalledWith({
            where: { id: 9, toUserId: 1 },
        });
        expect(db.notification.updateMany).toHaveBeenCalledWith({
            where: { id: 9, toUserId: 1, read: false },
            data: { read: true, readAt: expect.any(Date) },
        });
    });

    it('does not read or delete notifications owned by another user', async () => {
        db.notification.findFirst.mockResolvedValue(null);

        const readResponse = await app.inject({
            method: 'PATCH',
            url: '/api/notification/99/read',
            headers: { authorization: 'Bearer token' },
        });
        const deleteResponse = await app.inject({
            method: 'DELETE',
            url: '/api/notification/delete/99',
            headers: { authorization: 'Bearer token' },
        });

        expect(readResponse.statusCode).toBe(404);
        expect(deleteResponse.statusCode).toBe(404);
        expect(db.notification.updateMany).not.toHaveBeenCalled();
        expect(db.notification.deleteMany).not.toHaveBeenCalled();
    });

    it('keeps delete-all idempotent while preserving the existing path', async () => {
        db.notification.deleteMany.mockResolvedValueOnce({ count: 0 });

        const response = await app.inject({
            method: 'DELETE',
            url: '/api/notification/delete-all',
            headers: { authorization: 'Bearer token' },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({ message: 'Todas notificações removidas.' });
        expect(db.notification.deleteMany).toHaveBeenCalledWith({ where: { toUserId: 1 } });
        expect(db.notification.count).not.toHaveBeenCalled();
    });
});
