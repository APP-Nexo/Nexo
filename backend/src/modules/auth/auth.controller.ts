import type { FastifyReply, FastifyRequest } from 'fastify';
import type {
    ForgotPasswordPayload,
    LoginPayload,
    RefreshParam,
    RegisterPayload,
    ResetPasswordPayload,
} from './auth.interfaces.js';
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

    static async logout(_req: FastifyRequest, reply: FastifyReply) {
        return reply.status(200).send({ message: 'Logout realizado.' });
    }

    static async forgotPassword(req: FastifyRequest, reply: FastifyReply) {
        const { email } = req.body as ForgotPasswordPayload;
        const result = await AuthService.forgotPassword(email);
        const smtpConfigured = process.env.SMTP_USER && process.env.SMTP_PASS;
        if (result && !smtpConfigured) {
            return reply.status(200).send({
                message: 'Token gerado (modo desenvolvimento — configure SMTP em produção).',
                token: result.token,
                expiresAt: result.expiresAt,
            });
        }
        return reply
            .status(200)
            .send({ message: 'Se o email existir, você receberá um link de redefinição.' });
    }

    static async resetPassword(req: FastifyRequest, reply: FastifyReply) {
        const { token, password } = req.body as ResetPasswordPayload;
        await AuthService.resetPassword(token, password);
        return reply.status(200).send({ message: 'Senha redefinida com sucesso.' });
    }
}
