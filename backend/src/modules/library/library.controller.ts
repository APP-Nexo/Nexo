import type { FastifyReply, FastifyRequest } from 'fastify';
import type { UserTokenPayload } from '../../shared/utils/jwt/jwt.interfaces.js';
import type {
    CreateLibraryListPayload,
    LibraryFavoritesQuery,
    LibraryGamesQuery,
    UpdateLibraryListPayload,
    UpsertLibraryGamePayload,
} from './library.interfaces.js';
import { LibraryService } from './library.service.js';

type GameParams = { gameId: number };
type ListParams = { id: number };
type ListGameParams = ListParams & GameParams;

function userIdFrom(req: FastifyRequest) {
    return (req as FastifyRequest & { user: UserTokenPayload }).user.id;
}

export class LibraryController {
    static async getGames(req: FastifyRequest, reply: FastifyReply) {
        const response = await LibraryService.getGames(
            userIdFrom(req),
            req.query as LibraryGamesQuery,
        );
        return reply.status(200).send(response);
    }

    static async getFavorites(req: FastifyRequest, reply: FastifyReply) {
        const response = await LibraryService.getFavorites(
            userIdFrom(req),
            req.query as LibraryFavoritesQuery,
        );
        return reply.status(200).send(response);
    }

    static async upsertGame(req: FastifyRequest, reply: FastifyReply) {
        const { gameId } = req.params as GameParams;
        const response = await LibraryService.upsertGame(
            userIdFrom(req),
            gameId,
            req.body as UpsertLibraryGamePayload,
        );
        return reply.status(200).send(response);
    }

    static async deleteGame(req: FastifyRequest, reply: FastifyReply) {
        const { gameId } = req.params as GameParams;
        await LibraryService.deleteGame(userIdFrom(req), gameId);
        return reply.status(204).send();
    }

    static async getLists(req: FastifyRequest, reply: FastifyReply) {
        const response = await LibraryService.getLists(userIdFrom(req));
        return reply.status(200).send(response);
    }

    static async createList(req: FastifyRequest, reply: FastifyReply) {
        const response = await LibraryService.createList(
            userIdFrom(req),
            req.body as CreateLibraryListPayload,
        );
        return reply.status(201).send(response);
    }

    static async updateList(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as ListParams;
        const response = await LibraryService.updateList(
            userIdFrom(req),
            id,
            req.body as UpdateLibraryListPayload,
        );
        return reply.status(200).send(response);
    }

    static async deleteList(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as ListParams;
        await LibraryService.deleteList(userIdFrom(req), id);
        return reply.status(204).send();
    }

    static async addGameToList(req: FastifyRequest, reply: FastifyReply) {
        const { id, gameId } = req.params as ListGameParams;
        const response = await LibraryService.addGameToList(userIdFrom(req), id, gameId);
        return reply.status(200).send(response);
    }

    static async removeGameFromList(req: FastifyRequest, reply: FastifyReply) {
        const { id, gameId } = req.params as ListGameParams;
        await LibraryService.removeGameFromList(userIdFrom(req), id, gameId);
        return reply.status(204).send();
    }
}
