import type { FastifyReply, FastifyRequest } from 'fastify';
import { checkToken } from '../../shared/middlewares/check_token.js';
import { gamesService } from './games.service.js';
import type { ListGamesQuery, ReviewsQuery } from './games.types.js';

type GameParams = {
    id: number;
};

type TrendingQuery = {
    limit?: number;
};

async function optionalUserId(request: FastifyRequest): Promise<number | undefined> {
    if (!request.headers.authorization || typeof request.jwtVerify !== 'function') return undefined;

    await checkToken(request);

    const user = request.user as { id?: unknown } | undefined;
    return typeof user?.id === 'number' && Number.isSafeInteger(user.id) && user.id > 0
        ? user.id
        : undefined;
}

export class GamesController {
    static async list(request: FastifyRequest, reply: FastifyReply) {
        const result = await gamesService.listGames(request.query as ListGamesQuery);
        return reply.status(200).send(result);
    }

    static async trending(request: FastifyRequest, reply: FastifyReply) {
        const { limit } = request.query as TrendingQuery;
        const result = await gamesService.trendingGames(limit);
        return reply.status(200).send(result);
    }

    static async detail(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as GameParams;
        const result = await gamesService.getGame(id, await optionalUserId(request));
        return reply.status(200).send(result);
    }

    static async reviews(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as GameParams;
        const result = await gamesService.getReviews(id, request.query as ReviewsQuery);
        return reply.status(200).send(result);
    }
}
