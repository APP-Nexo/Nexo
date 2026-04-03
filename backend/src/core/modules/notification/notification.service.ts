import { NotificationErrors } from './notificiation.errors.js';
import prisma from '../../shared/utils/prisma/prisma_conn.js';

export class NotificationService {
    static async getNotifications(userId: number, cursor?: string) 
    {
        const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
            where: { toUserId: userId },
            include: {
            fromUser: {
                select: { id: true, name: true }
            }
            },
            orderBy: { createdAt: 'desc' },
            take: 6,
            ...(cursor && { cursor: { id: Number(cursor) }, skip: 1 }),
        }),
        prisma.notification.count({ where: { toUserId: userId } })
        ]);

        const nextCursor = notifications.length === 6 ? notifications[5]?.id ?? null : null;
        const data = notifications.slice(0, 5);

        return { notifications: data, nextCursor, total };
    }

    static async readAllNotifications(userId: number) 
    {
        await NotificationErrors.ensureHasUnreadNotifications(prisma.notification, userId);
        
        await prisma.notification.updateMany({
            where: { toUserId: userId, read: false },
            data: { read: true }
        });

        return { message: 'Todas notificações marcadas como lidas.' };
    }

    static async deleteNotification(notificationId: number, userId: number) 
    {
        await NotificationErrors.ensureNotificationExists(prisma.notification, notificationId, userId);

        await prisma.notification.deleteMany({
            where: { id: notificationId, toUserId: userId }
        });

        return { message: 'Notificação removida.' };
    }

    static async deleteAllNotifications(userId: number) 
    {
        await NotificationErrors.ensureHasNotifications(prisma.notification, userId);

        await prisma.notification.deleteMany({
            where: { toUserId: userId }
        });

        return { message: 'Todas notificações removidas.' };
    }
}