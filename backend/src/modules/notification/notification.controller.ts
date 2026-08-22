import type { FastifyReply, FastifyRequest } from 'fastify';
import type { UserTokenPayload } from '../../shared/utils/jwt/jwt.interfaces.js';
import type {
    NotificationIdParams,
    NotificationPaginationQuery,
} from './notification.interfaces.js';
import { NotificationService } from './notification.service.js';

export class NotificationController {
    static async getNotifications(req: FastifyRequest, reply: FastifyReply) {
        const { cursor } = req.query as NotificationPaginationQuery;
        const tokenUser = req.user as UserTokenPayload;

        const response = await NotificationService.getNotifications(tokenUser.id, cursor);
        return reply.status(200).send(response);
    }

    static async readAllNotifications(req: FastifyRequest, reply: FastifyReply) {
        const tokenUser = req.user as UserTokenPayload;

        const response = await NotificationService.readAllNotifications(tokenUser.id);
        return reply.status(200).send(response);
    }

    static async readNotification(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as NotificationIdParams;
        const tokenUser = req.user as UserTokenPayload;

        const response = await NotificationService.readNotification(Number(id), tokenUser.id);
        return reply.status(200).send(response);
    }

    static async deleteNotification(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as NotificationIdParams;
        const tokenUser = req.user as UserTokenPayload;

        const response = await NotificationService.deleteNotification(Number(id), tokenUser.id);
        return reply.status(200).send(response);
    }

    static async deleteAllNotifications(req: FastifyRequest, reply: FastifyReply) {
        const tokenUser = req.user as UserTokenPayload;

        const response = await NotificationService.deleteAllNotifications(tokenUser.id);
        return reply.status(200).send(response);
    }
}
