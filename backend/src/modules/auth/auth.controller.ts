import type { FastifyReply, FastifyRequest } from 'fastify';
import type { LoginPayload, RefreshParam, RegisterPayload } from './auth.interfaces.js';
import { AuthService } from './auth.service.js';

export class AuthController {
    static async register(req: FastifyRequest, reply: FastifyReply) {
        const response = await AuthService.register(req.body as RegisterPayload);
        return reply.status(201).send(response);
    }

    static async login(req: FastifyRequest, reply: FastifyReply) {
        const { email, password } = req.body as LoginPayload;

        const response = await AuthService.login(email!, password);
        return reply.status(201).send(response);
    }

    static async refresh(req: FastifyRequest, reply: FastifyReply) {
        const { refreshToken } = req.body as RefreshParam;
        const response = await AuthService.refresh(refreshToken);
        return reply.status(200).send(response);
    }
}
