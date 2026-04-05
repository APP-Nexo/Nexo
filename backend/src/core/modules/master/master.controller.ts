import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ParamId } from '../../shared/types/common.types.js';
import { MasterService } from './master.service.js';

export class MasterController {
    // ===========================================================================================
    //  @patch: /api/master/user/:id/promote
    //  @returns: { message: 'Usuário promovido para admin.', email: user?.email, role: 'admin' }
    //  @status:  200
    // ===========================================================================================
    static async promoteUser(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = req.params as ParamId;

            const response = await MasterService.promoteUser(Number(id));
            return reply.status(200).send(response);
        } catch (error) {
            throw error;
        }
    }

    // =========================================================================================
    //  @patch: /api/master/user/:id/demote
    //  @returns: { message: 'Usuário rebaixado para user.', email: user?.email, role: 'user' }
    //  @status:  200 OK
    // =========================================================================================
    static async demoteUser(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = req.params as ParamId;

            const response = await MasterService.demoteUser(Number(id));
            return reply.status(200).send(response);
        } catch (error) {
            throw error;
        }
    }

    // ==================================================================================================
    //  @patch: /api/master/user/:id/ban
    //  @returns: { message: 'Usuário banido.', email: user?.email, bannedAt: new Date().toISOString() }
    //  @status:  200 OK
    // ==================================================================================================
    static async banUser(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = req.params as ParamId;

            const response = await MasterService.banUser(Number(id));
            return reply.status(200).send(response);
        } catch (error) {
            throw error;
        }
    }
}
