import 'dotenv/config';
import '@fastify/jwt';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { app } from '../../../../conf.js';
import type { UserTokenPayload } from './jwt.interfaces.js';
import { TokenErrors } from './token.errors.js';

export class JwtToken {
    static async create(user: UserTokenPayload, reply: FastifyReply) {
        try {
            const token = app.jwt.sign(
                {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    roleId: user.roleId,
                },
                { expiresIn: process.env.TOKEN_EXPIRES! },
            );

            return token;
        } catch (e) {
            TokenErrors.throwCreationFailed();
        }
    }

    static async getByUser(req: FastifyRequest) {
        try {
            await req.jwtVerify();

            const user = req.user as UserTokenPayload;

            return user;
        } catch (e) {
            TokenErrors.throwInvalid();
        }
    }
}
