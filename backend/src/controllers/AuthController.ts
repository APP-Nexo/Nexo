import type { FastifyRequest, FastifyReply } from 'fastify';

import { AuthErrors } from '../helpers/errors/auth-errors.js';
import { JwtToken } from '../helpers/utils/jwt_token.js';
import { encryptPassword } from '../helpers/utils/encrypt_password.js';

import type { RegisterPayload, UserPayload } from '../helpers/interfaces/I-Auth.js';
import type { UserTokenPayload } from '../helpers/interfaces/I-Jwt.js';

import { GenericQueries } from '../repository/generics.js';
import prisma from '../helpers/utils/prisma_conn.js';
const userQuery = new GenericQueries(prisma.user)

export class AuthController 
{
    static async register(req: FastifyRequest, reply: FastifyReply)
    {
        const { name, email, password, confirmPassword } = req.body as RegisterPayload

        AuthErrors.ensureRegister({ name, email, password, confirmPassword })
        await AuthErrors.ensureUserNotExists(userQuery, email)

        const user = {
            name,
            email,
            password: await encryptPassword(password),
            access: 'user'
        }

        await userQuery.create(user)

        const { password: _, ...userPayload } = user as UserPayload
        const token = await JwtToken.create(userPayload as UserTokenPayload, reply)

        return reply.status(201).send({ "user": userPayload, token })
    }

    static async login(req: FastifyRequest, reply: FastifyReply)
    {
    
    }
}