import type { FastifyReply, FastifyRequest } from 'fastify';
import type { UserTokenPayload } from '../../shared/utils/jwt/jwt.interfaces.js';
import { SocialService } from './social.service.js';

export class SocialController {
    static async followUser(req: FastifyRequest, reply: FastifyReply) {
        const { username } = req.params as { username: string };
        const tokenUser = req.user as UserTokenPayload;
        const response = await SocialService.followUser(tokenUser.id, username);
        return reply.status(201).send(response);
    }

    static async unfollowUser(req: FastifyRequest, reply: FastifyReply) {
        const { username } = req.params as { username: string };
        const tokenUser = req.user as UserTokenPayload;
        const response = await SocialService.unfollowUser(tokenUser.id, username);
        return reply.status(200).send(response);
    }

    static async getFollowers(req: FastifyRequest, reply: FastifyReply) {
        const { username } = req.params as { username: string };
        const { cursor } = req.query as { cursor?: string };
        const tokenUser = req.user as UserTokenPayload;
        const response = await SocialService.getFollowers(username, tokenUser.id, cursor);
        return reply.status(200).send(response);
    }

    static async getFollowing(req: FastifyRequest, reply: FastifyReply) {
        const { username } = req.params as { username: string };
        const { cursor } = req.query as { cursor?: string };
        const tokenUser = req.user as UserTokenPayload;
        const response = await SocialService.getFollowing(username, tokenUser.id, cursor);
        return reply.status(200).send(response);
    }

    static async getFeed(req: FastifyRequest, reply: FastifyReply) {
        const { cursor } = req.query as { cursor?: string };
        const tokenUser = req.user as UserTokenPayload;
        const response = await SocialService.getFeed(tokenUser.id, cursor);
        return reply.status(200).send(response);
    }
}
