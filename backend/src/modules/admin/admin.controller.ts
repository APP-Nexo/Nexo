import type { FastifyReply, FastifyRequest } from 'fastify';
import type { PaginationPayload, SearchByEmailPayload } from './admin.interfaces.js';
import { AdminService } from './admin.service.js';

export class AdminController {
    static async getUsersStats(_req: FastifyRequest, reply: FastifyReply) {
        const response = await AdminService.getUsersStats();
        return reply.status(200).send(response);
    }

    static async getUsersAdmin(_req: FastifyRequest, reply: FastifyReply) {
        const response = await AdminService.getUsersAdmin();
        return reply.status(200).send(response);
    }

    static async searchUser(req: FastifyRequest, reply: FastifyReply) {
        const { email, cursor } = req.query as SearchByEmailPayload;

        const response = await AdminService.searchUser(email, cursor);
        return reply.status(200).send(response);
    }

    static async getUsers(req: FastifyRequest, reply: FastifyReply) {
        const { cursor, limit = 10 } = req.query as PaginationPayload;

        const response = await AdminService.getUsers(cursor, Number(limit));
        return reply.status(200).send(response);
    }
}
