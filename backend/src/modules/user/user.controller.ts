import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ParamCursor, ParamId } from '../../shared/types/common.types.js';
import type { UserTokenPayload } from '../../shared/utils/jwt/jwt.interfaces.js';
import type { UserPayload } from '../auth/auth.interfaces.js';
import type { SearchUserQuery } from './user.interfaces.js';
import { UserService } from './user.service.js';

export class UserController {
    static async searchUser(req: FastifyRequest, reply: FastifyReply) {
        const { find, cursor } = req.query as SearchUserQuery;
        const tokenUser = req.user as UserPayload;

        const response = await UserService.searchUser(tokenUser, find, cursor);
        return reply.status(200).send(response);
    }

    static async getUser(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as ParamId;
        const tokenUser = req.user as UserPayload;

        const response = await UserService.getUser(tokenUser, Number(id));
        return reply.status(200).send(response);
    }

    static async delete(req: FastifyRequest, reply: FastifyReply) {
        const { email } = req.body as { email: string };
        const tokenUser = req.user as UserTokenPayload;

        const response = await UserService.deleteUser(tokenUser, email);
        return reply.status(200).send(response);
    }

    static async getFollowers(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as ParamId;
        const { cursor } = req.query as ParamCursor;
        const tokenUser = req.user as UserPayload;

        const response = await UserService.getFollowers(tokenUser, Number(id), cursor);
        return reply.send(response);
    }

    static async getFollowings(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as ParamId;
        const { cursor } = req.query as ParamCursor;
        const tokenUser = req.user as UserPayload;

        const response = await UserService.getFollowings(tokenUser, Number(id), cursor);
        return reply.send(response);
    }
}
