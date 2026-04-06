import type { FastifyReply, FastifyRequest } from 'fastify';
import type { LoginPayload, RefreshParam, RegisterPayload } from './auth.interfaces.js';
import { AuthService } from './auth.service.js';

export class AuthController {
    // =======================================================================
    //  @post: /api/auth/register
    //  @returns: { tokenType: process.env.TOKEN_TYPE!, token, refreshToken }
    //  @status:  201
    // =======================================================================
    static async register(req: FastifyRequest, reply: FastifyReply) {
        try {
            const response = await AuthService.register(req.body as RegisterPayload);
            return reply.status(201).send(response);
        } catch (error) {
            throw error;
        }
    }

    // =======================================================================
    //  @post: /api/auth/login
    //  @returns: { tokenType: process.env.TOKEN_TYPE!, token, refreshToken }
    //  @status:  201 OK
    // =======================================================================
    static async login(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { email, password } = req.body as LoginPayload;

            const response = await AuthService.login(email!, password);
            return reply.status(201).send(response);
        } catch (error) {
            throw error;
        }
    }

    // =======================================================================================================
    //  @post: /api/auth/refresh
    //  @returns: { tokenType: process.env.TOKEN_TYPE!, refreshToken, expiresIn: process.env.TOKEN_EXPIRES! }
    //  @status:  200 OK
    // =======================================================================================================
    static async refresh(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { refreshToken } = req.body as RefreshParam;
            const response = await AuthService.refresh(refreshToken);
            return reply.status(200).send(response);
        } catch (error) {
            throw error;
        }
    }
}
