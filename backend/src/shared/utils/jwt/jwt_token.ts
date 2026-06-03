import 'dotenv/config';
import '@fastify/jwt';
import type { FastifyRequest } from 'fastify';
import { app } from '../../../conf.js';
import type { UserTokenPayload } from './jwt.interfaces.js';
import { TokenErrors } from './token.errors.js';

export class JwtToken {
    static async create(user: UserTokenPayload) {
        try {
            const token = app.jwt.sign(
                {
                    id: user.id,
                    email: user.email,
                    roleId: user.roleId,
                },
                { expiresIn: process.env.TOKEN_EXPIRES! },
            );

            return token;
        } catch (error) {
            console.log(error);
            TokenErrors.throwCreationFailed();
        }
    }

    static async createRefresh(user: UserTokenPayload) {
        try {
            const refreshToken = app.jwt.sign(
                {
                    id: user.id,
                    email: user.email,
                    roleId: user.roleId,
                },
                { expiresIn: process.env.REFRESH_TOKEN_EXPIRES! },
            );

            return refreshToken;
        } catch (error) {
            console.log(error);
            TokenErrors.throwCreationFailed();
        }
    }

    static async getByUser(req: FastifyRequest) {
        try {
            await req.jwtVerify();

            const user = req.user as UserTokenPayload;

            return user;
        } catch (error) {
            console.log(error);
            TokenErrors.throwInvalid();
        }
    }
}
