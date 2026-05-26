import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ParamCursor, ParamId } from '../../shared/types/common.types.js';
import type { UserTokenPayload } from '../../shared/utils/jwt/jwt.interfaces.js';
import { NotificationService } from './notification.service.js';

export class NotificationController {
    static async getNotifications(req: FastifyRequest, reply: FastifyReply) {
        const { cursor } = req.query as ParamCursor;
        const tokenUser = req.user as UserTokenPayload;

        const response = await NotificationService.getNotifications(tokenUser.id, cursor);
        return reply.status(200).send(response);
    }

    static async readAllNotifications(req: FastifyRequest, reply: FastifyReply) {
        const tokenUser = req.user as UserTokenPayload;

        const response = await NotificationService.readAllNotifications(tokenUser.id);
        return reply.status(200).send(response);
    }

    static async deleteNotification(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as ParamId;
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
