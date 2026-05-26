import type { FastifyReply, FastifyRequest } from 'fastify';
import type { UserTokenPayload } from '../../shared/utils/jwt/jwt.interfaces.js';
import { UsersService } from './users.service.js';

export class UsersController {
    static async getProfile(req: FastifyRequest, reply: FastifyReply) {
        const { username } = req.params as { username: string };
        const tokenUser = req.user as UserTokenPayload | undefined;
        const response = await UsersService.getUserByUsername(username, tokenUser?.id);
        return reply.status(200).send(response);
    }

    static async getReviews(req: FastifyRequest, reply: FastifyReply) {
        const { username } = req.params as { username: string };
        const { cursor } = req.query as { cursor?: string };
        const response = await UsersService.getUserReviews(username, cursor);
        return reply.status(200).send(response);
    }

    static async getStats(req: FastifyRequest, reply: FastifyReply) {
        const { username } = req.params as { username: string };
        const response = await UsersService.getUserStats(username);
        return reply.status(200).send(response);
    }

    static async getLists(req: FastifyRequest, reply: FastifyReply) {
        const { username } = req.params as { username: string };
        const response = await UsersService.getUserLists(username);
        return reply.status(200).send(response);
    }
}
