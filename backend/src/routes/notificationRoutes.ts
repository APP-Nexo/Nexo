import type { FastifyInstance } from 'fastify';
import { NotificationController } from '../controllers/NotificationController.js';
import { checkToken } from '../middlewares/check_token.js';

export async function notificationRoutes(app: FastifyInstance) {
    app.get('/', { preHandler: [checkToken] }, NotificationController.getNotifications)
    app.patch('/read-all', { preHandler: [checkToken] }, NotificationController.readAllNotifications)
    app.delete('/delete/:id', { preHandler: [checkToken] }, NotificationController.deleteNotification)
    app.delete('/delete-all', { preHandler: [checkToken] }, NotificationController.deleteAllNotifications)
}