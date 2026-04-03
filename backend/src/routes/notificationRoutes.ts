import type { FastifyInstance } from 'fastify';
import { NotificationController } from '../controllers/NotificationController.js';
import { checkToken } from '../middlewares/check_token.js';
import {
    getNotificationsSchemaSwagger,
    readAllNotificationsSchemaSwagger,
    deleteNotificationSchemaSwagger,
    deleteAllNotificationsSchemaSwagger
} from '../../documentation/notification.swagger.js';

export async function notificationRoutes(app: FastifyInstance) {
    app.get('/',             { ...getNotificationsSchemaSwagger,       preHandler: [checkToken] }, NotificationController.getNotifications)
    app.patch('/read-all',   { ...readAllNotificationsSchemaSwagger,   preHandler: [checkToken] }, NotificationController.readAllNotifications)
    app.delete('/delete/:id',{ ...deleteNotificationSchemaSwagger,     preHandler: [checkToken] }, NotificationController.deleteNotification)
    app.delete('/delete-all',{ ...deleteAllNotificationsSchemaSwagger, preHandler: [checkToken] }, NotificationController.deleteAllNotifications)
}