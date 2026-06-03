import type { FastifyReply, FastifyRequest } from 'fastify';
import type { UserTokenPayload } from '../../shared/utils/jwt/jwt.interfaces.js';
import type { PaginationPayload, SearchByEmailPayload } from './admin.interfaces.js';
import { AdminService } from './admin.service.js';

export class AdminController {
    static async getDashboard(_req: FastifyRequest, reply: FastifyReply) {
        const response = await AdminService.getDashboard();
        return reply.status(200).send(response);
    }

    static async getUsersStats(_req: FastifyRequest, reply: FastifyReply) {
        const response = await AdminService.getUsersStats();
        return reply.status(200).send(response);
    }

    static async getUsersAdmin(_req: FastifyRequest, reply: FastifyReply) {
        const response = await AdminService.getUsersAdmin();
        return reply.status(200).send(response);
    }

    static async searchUser(req: FastifyRequest, reply: FastifyReply) {
        const { q, cursor } = req.query as SearchByEmailPayload;
        const response = await AdminService.searchUser(q, cursor);
        return reply.status(200).send(response);
    }

    static async getUsers(req: FastifyRequest, reply: FastifyReply) {
        const { cursor, limit = 10 } = req.query as PaginationPayload;
        const response = await AdminService.getUsers(cursor, Number(limit));
        return reply.status(200).send(response);
    }

    static async getUserDetail(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        const response = await AdminService.getUserDetail(Number(id));
        return reply.status(200).send(response);
    }

    static async blockUser(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        const tokenUser = req.user as UserTokenPayload;
        const { reason } = req.body as { reason?: string };
        const response = await AdminService.blockUser(Number(id), tokenUser.id, reason);
        return reply.status(200).send(response);
    }

    static async unblockUser(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        const response = await AdminService.unblockUser(Number(id));
        return reply.status(200).send(response);
    }

    static async deleteUser(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        const response = await AdminService.deleteUser(Number(id));
        return reply.status(200).send(response);
    }

    static async getReviews(req: FastifyRequest, reply: FastifyReply) {
        const { status, cursor } = req.query as { status?: string; cursor?: string };
        const response = await AdminService.getReviews(status, cursor);
        return reply.status(200).send(response);
    }

    static async deleteReview(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        const response = await AdminService.deleteReview(Number(id));
        return reply.status(200).send(response);
    }

    static async getReports(_req: FastifyRequest, reply: FastifyReply) {
        const response = await AdminService.getReports();
        return reply.status(200).send(response);
    }

    static async resolveReport(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        const response = await AdminService.resolveReport(Number(id));
        return reply.status(200).send(response);
    }
}
