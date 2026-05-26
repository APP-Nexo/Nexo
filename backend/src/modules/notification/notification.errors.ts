import { AppError } from '../../shared/errors/app-error.js';

export class NotificationErrors extends AppError {
    constructor(message: string, statusCode: number) {
        super(message, statusCode, 'Notification Errors');
    }

    static throw(message: string, statusCode: number): never {
        throw new NotificationErrors(message, statusCode);
    }

    static async ensureNotificationExists(table: any, id: number, toUserId: number) {
        const exists = await table.findFirst({ where: { id, toUserId } });
        if (!exists) NotificationErrors.throw('Notificação não existe.', 404);
    }

    static async ensureHasNotifications(table: any, toUserId: number) {
        const count = await table.count({ where: { toUserId } });
        if (count === 0) NotificationErrors.throw('Você não possui notificações.', 404);
    }

    static async ensureHasUnreadNotifications(table: any, toUserId: number) {
        const count = await table.count({ where: { toUserId, read: false } });
        if (count === 0) NotificationErrors.throw('Você não possui notificações não lidas.', 404);
    }
}
