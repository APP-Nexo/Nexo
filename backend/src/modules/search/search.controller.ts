import type { FastifyReply, FastifyRequest } from 'fastify';
import { SearchService } from './search.service.js';

export class SearchController {
    static async searchUsers(req: FastifyRequest, reply: FastifyReply) {
        const { q, cursor, limit } = req.query as { q: string; cursor?: string; limit?: number };
        const response = await SearchService.searchUsers(q, cursor, limit);
        return reply.status(200).send(response);
    }
}
