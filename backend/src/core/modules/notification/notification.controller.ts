import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ParamCursor, ParamId } from '../../shared/types/common.types.js';
import type { UserTokenPayload } from '../../shared/utils/jwt/jwt.interfaces.js';
import { NotificationService } from './notification.service.js';

export class NotificationController {
    // ==================================================
    //  @get: /api/notification
    //  @returns: { notifications, nextCursor, total }
    //  @status:  200 OK
    // ==================================================
    static async getNotifications(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { cursor } = req.query as ParamCursor;
            const tokenUser = req.user as UserTokenPayload;

            const response = await NotificationService.getNotifications(tokenUser.id, cursor);
            return reply.status(200).send(response);
        } catch (error) {
            throw error;
        }
    }

    // ==================================================================
    //  @patch: /api/notification/read-all
    //  @returns: { message: 'Todas notificações marcadas como lidas.' }
    //  @status:  200 OK
    // ==================================================================
    static async readAllNotifications(req: FastifyRequest, reply: FastifyReply) {
        try {
            const tokenUser = req.user as UserTokenPayload;

            const response = await NotificationService.readAllNotifications(tokenUser.id);
            return reply.status(200).send(response);
        } catch (error) {
            throw error;
        }
    }

    // =================================================
    //  @delete: /api/notification/delete/:id
    //  @returns: { message: 'Notificação removida.' }
    //  @status:  200 OK
    // =================================================
    static async deleteNotification(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = req.params as ParamId;
            const tokenUser = req.user as UserTokenPayload;

            const response = await NotificationService.deleteNotification(Number(id), tokenUser.id);
            return reply.status(200).send(response);
        } catch (error) {
            throw error;
        }
    }

    // ========================================================
    //  @delete: /api/notification/delete-all
    //  @return: { message: 'Todas notificações removidas.' }
    //  @status:  200 OK
    // ========================================================
    static async deleteAllNotifications(req: FastifyRequest, reply: FastifyReply) {
        try {
            const tokenUser = req.user as UserTokenPayload;

            const response = await NotificationService.deleteAllNotifications(tokenUser.id);
            return reply.status(200).send(response);
        } catch (error) {
            throw error;
        }
    }
}
