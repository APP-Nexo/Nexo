import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ParamId } from '../../shared/types/common.types.js';
import type { UserTokenPayload } from '../../shared/utils/jwt/jwt.interfaces.js';
import { MasterService } from './master.service.js';

export class MasterController {
    static async promoteUser(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as ParamId;
        const actor = req.user as UserTokenPayload;

        const response = await MasterService.promoteUser(Number(id), actor.id);
        return reply.status(200).send(response);
    }

    static async demoteUser(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as ParamId;
        const actor = req.user as UserTokenPayload;

        const response = await MasterService.demoteUser(Number(id), actor.id);
        return reply.status(200).send(response);
    }

    static async banUser(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as ParamId;
        const actor = req.user as UserTokenPayload;

        const response = await MasterService.banUser(Number(id), actor.id);
        return reply.status(200).send(response);
    }
}
