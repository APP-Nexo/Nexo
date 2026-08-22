import type { FastifyReply, FastifyRequest } from 'fastify';
import type { SearchUsersQuery } from './search.interfaces.js';
import { SearchService } from './search.service.js';

export class SearchController {
    static async searchUsers(req: FastifyRequest, reply: FastifyReply) {
        const { q, cursor, limit, suggested } = req.query as SearchUsersQuery;
        const response = await SearchService.searchUsers(q, cursor, limit, suggested);
        return reply.status(200).send(response);
    }
}
