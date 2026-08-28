import {
    normalizePrismaCursor,
    normalizePrismaId,
} from '../../shared/infrastructure/validation/prisma-values.js';
import { cursorPaginate } from '../../shared/utils/pagination/cursor-paginate.js';
import prisma from '../../shared/utils/prisma/prisma_conn.js';
import { NotificationErrors } from './notification.errors.js';
import type {
    NotificationMessageResponse,
    NotificationsResponse,
} from './notification.interfaces.js';

async function ensureNotificationExists(notificationId: number, userId: number) {
    const exists = await prisma.notification.findFirst({
        where: { id: notificationId, toUserId: userId },
    });
    if (!exists) NotificationErrors.throw('Notificação não existe.', 404);
}

export class NotificationService {
    static async getNotifications(
        userId: number,
        cursor?: string | number,
    ): Promise<NotificationsResponse> {
        const { data, nextCursor } = await cursorPaginate({
            findMany: (args) =>
                prisma.notification.findMany({
                    ...args,
                    where: { toUserId: userId },
                    select: {
                        id: true,
                        type: true,
                        read: true,
                        readAt: true,
                        entityType: true,
                        entityId: true,
                        metadata: true,
                        createdAt: true,
                        toUserId: true,
                        fromUserId: true,
                        fromUser: {
                            select: {
                                id: true,
                                username: true,
                                profile: { select: { photo: true } },
                            },
                        },
                    },
                    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
                }),
            take: 10,
            cursor: normalizePrismaCursor(cursor, NotificationErrors.throw),
        });

        const [total, unreadCount] = await Promise.all([
            prisma.notification.count({ where: { toUserId: userId } }),
            prisma.notification.count({ where: { toUserId: userId, read: false } }),
        ]);

        return {
            notifications: data.map((notification) => ({
                id: notification.id,
                type: notification.type,
                read: notification.read,
                readAt: notification.readAt,
                entityType: notification.entityType,
                entityId: notification.entityId,
                metadata: notification.metadata,
                createdAt: notification.createdAt,
                toUserId: notification.toUserId,
                fromUserId: notification.fromUserId,
                fromUser: notification.fromUser
                    ? {
                          id: notification.fromUser.id,
                          username: notification.fromUser.username,
                          photo: notification.fromUser.profile?.photo ?? null,
                      }
                    : null,
            })),
            nextCursor,
            total,
            unreadCount,
        };
    }

    static async readAllNotifications(userId: number): Promise<NotificationMessageResponse> {
        await prisma.notification.updateMany({
            where: { toUserId: userId, read: false },
            data: { read: true, readAt: new Date() },
        });

        return { message: 'Todas notificações marcadas como lidas.' };
    }

    static async readNotification(
        notificationId: number,
        userId: number,
    ): Promise<NotificationMessageResponse> {
        normalizePrismaId(notificationId, 'ID de notificação', NotificationErrors.throw);
        await ensureNotificationExists(notificationId, userId);

        await prisma.notification.updateMany({
            where: { id: notificationId, toUserId: userId, read: false },
            data: { read: true, readAt: new Date() },
        });

        return { message: 'Notificação marcada como lida.' };
    }

    static async deleteNotification(
        notificationId: number,
        userId: number,
    ): Promise<NotificationMessageResponse> {
        normalizePrismaId(notificationId, 'ID de notificação', NotificationErrors.throw);
        await ensureNotificationExists(notificationId, userId);

        await prisma.notification.deleteMany({
            where: { id: notificationId, toUserId: userId },
        });

        return { message: 'Notificação removida.' };
    }

    static async deleteAllNotifications(userId: number): Promise<NotificationMessageResponse> {
        await prisma.notification.deleteMany({ where: { toUserId: userId } });
        return { message: 'Todas notificações removidas.' };
    }
}
