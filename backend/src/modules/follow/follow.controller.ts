import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ParamId } from '../../shared/types/common.types.js';
import type { UserTokenPayload } from '../../shared/utils/jwt/jwt.interfaces.js';
import { FollowService } from './follow.service.js';

export class FollowController {
    static async followUser(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as ParamId;
        const tokenUser = req.user as UserTokenPayload;

        const response = await FollowService.followUser(tokenUser.id, Number(id));
        return reply.status(201).send(response);
    }

    static async unfollowUser(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as ParamId;
        const tokenUser = req.user as UserTokenPayload;

        const response = await FollowService.unfollowUser(tokenUser.id, Number(id));
        return reply.status(200).send(response);
    }
}
