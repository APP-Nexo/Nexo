import type { FastifyReply, FastifyRequest } from 'fastify';
import type { UserTokenPayload } from '../../shared/utils/jwt/jwt.interfaces.js';
import type { ChangePasswordPayload, UpdateMePayload } from './me.interfaces.js';
import { MeService } from './me.service.js';

export class MeController {
    static async getMe(req: FastifyRequest, reply: FastifyReply) {
        const tokenUser = req.user as UserTokenPayload;
        const response = await MeService.getMe(tokenUser.id);
        return reply.status(200).send(response);
    }

    static async updateMe(req: FastifyRequest, reply: FastifyReply) {
        const tokenUser = req.user as UserTokenPayload;

        if (req.isMultipart()) {
            const response = await MeService.updateMeMultipart(tokenUser.id, req);
            return reply.status(200).send(response);
        }

        const response = await MeService.updateMe(tokenUser.id, req.body as UpdateMePayload);
        return reply.status(200).send(response);
    }

    static async changePassword(req: FastifyRequest, reply: FastifyReply) {
        const tokenUser = req.user as UserTokenPayload;
        const { currentPassword, newPassword } = req.body as ChangePasswordPayload;
        const response = await MeService.changePassword(tokenUser.id, currentPassword, newPassword);
        return reply.status(200).send(response);
    }

    static async deleteMe(req: FastifyRequest, reply: FastifyReply) {
        const tokenUser = req.user as UserTokenPayload;
        const { email } = req.body as { email: string };
        const response = await MeService.deleteMe(tokenUser.id, email);
        return reply.status(200).send(response);
    }
}
