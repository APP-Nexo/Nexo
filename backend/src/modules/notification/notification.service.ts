import { cursorPaginate } from '../../shared/utils/pagination/cursor-paginate.js';
import prisma from '../../shared/utils/prisma/prisma_conn.js';
import { NotificationErrors } from './notification.errors.js';
import type {
    NotificationMessageResponse,
    NotificationsResponse,
} from './notification.interfaces.js';

export class NotificationService {
    static async getNotifications(userId: number, cursor?: string): Promise<NotificationsResponse> {
        const { data, nextCursor } = await cursorPaginate({
            findMany: (args) =>
                prisma.notification.findMany({
                    ...args,
                    where: { toUserId: userId },
                    include: {
                        fromUser: {
                            select: { id: true, username: true },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                }),
            take: 5,
            cursor,
        });

        const total = await prisma.notification.count({ where: { toUserId: userId } });

        return { notifications: data as NotificationsResponse['notifications'], nextCursor, total };
    }

    static async readAllNotifications(userId: number): Promise<NotificationMessageResponse> {
        await NotificationErrors.ensureHasUnreadNotifications(prisma.notification, userId);

        await prisma.notification.updateMany({
            where: { toUserId: userId, read: false },
            data: { read: true },
        });

        return { message: 'Todas notificações marcadas como lidas.' };
    }

    static async deleteNotification(
        notificationId: number,
        userId: number,
    ): Promise<NotificationMessageResponse> {
        await NotificationErrors.ensureNotificationExists(
            prisma.notification,
            notificationId,
            userId,
        );

        await prisma.notification.deleteMany({
            where: { id: notificationId, toUserId: userId },
        });

        return { message: 'Notificação removida.' };
    }

    static async deleteAllNotifications(userId: number): Promise<NotificationMessageResponse> {
        await NotificationErrors.ensureHasNotifications(prisma.notification, userId);

        await prisma.notification.deleteMany({
            where: { toUserId: userId },
        });

        return { message: 'Todas notificações removidas.' };
    }
}
