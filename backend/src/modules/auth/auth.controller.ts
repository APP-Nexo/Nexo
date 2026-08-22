import type { FastifyReply, FastifyRequest } from 'fastify';
import type { UserTokenPayload } from '../../shared/utils/jwt/jwt.interfaces.js';
import type {
    ForgotPasswordPayload,
    LoginPayload,
    LogoutPayload,
    RefreshParam,
    RegisterPayload,
    ResetPasswordPayload,
    SessionMetadata,
} from './auth.interfaces.js';
import { AuthService } from './auth.service.js';

function getSessionMetadata(req: FastifyRequest): SessionMetadata {
    const userAgent = req.headers['user-agent'];
    return {
        ipAddress: req.ip,
        ...(typeof userAgent === 'string' ? { userAgent } : {}),
    };
}

export class AuthController {
    static async register(req: FastifyRequest, reply: FastifyReply) {
        const response = await AuthService.register(
            req.body as RegisterPayload,
            getSessionMetadata(req),
        );
        return reply.status(201).send(response);
    }

    static async login(req: FastifyRequest, reply: FastifyReply) {
        const { identifier, email, password } = req.body as LoginPayload;
        const response = await AuthService.login(
            identifier ?? email ?? '',
            password,
            getSessionMetadata(req),
        );
        return reply.status(200).send(response);
    }

    static async refresh(req: FastifyRequest, reply: FastifyReply) {
        const { refreshToken } = req.body as RefreshParam;
        const response = await AuthService.refresh(refreshToken, getSessionMetadata(req));
        return reply.status(200).send(response);
    }

    static async logout(req: FastifyRequest, reply: FastifyReply) {
        const user = req.user as UserTokenPayload;
        const { allSessions = false } = (req.body ?? {}) as LogoutPayload;
        await AuthService.logout(user.id, user.sid, allSessions);
        return reply.status(200).send({ message: 'Logout realizado.' });
    }

    static async forgotPassword(req: FastifyRequest, reply: FastifyReply) {
        const { email } = req.body as ForgotPasswordPayload;
        await AuthService.forgotPassword(email);
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
