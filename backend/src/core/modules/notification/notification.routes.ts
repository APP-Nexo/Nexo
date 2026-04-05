import type { FastifyInstance } from 'fastify';
import { checkToken } from '../../shared/middlewares/check_token.js';
import { NotificationController } from './notification.controller.js';
import {
    deleteAllNotificationsSchemaSwagger,
    deleteNotificationSchemaSwagger,
    getNotificationsSchemaSwagger,
    readAllNotificationsSchemaSwagger,
} from './notification.swagger.js';

export async function notificationRoutes(app: FastifyInstance) {
    app.get('/', {
        ...getNotificationsSchemaSwagger,
        preHandler: [checkToken],
        config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
    }, NotificationController.getNotifications);

    app.patch('/read-all', {
        ...readAllNotificationsSchemaSwagger,
        preHandler: [checkToken],
        config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    }, NotificationController.readAllNotifications);

    app.delete('/delete/:id', {
        ...deleteNotificationSchemaSwagger,
        preHandler: [checkToken],
        config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
    }, NotificationController.deleteNotification);

    app.delete('/delete-all', {
        ...deleteAllNotificationsSchemaSwagger,
        preHandler: [checkToken],
        config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
    }, NotificationController.deleteAllNotifications);
}
