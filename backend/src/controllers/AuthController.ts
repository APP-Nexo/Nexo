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

        const createdUser = await userQuery.create({
            name,
            email,
            password: await encryptPassword(password),
            access: 'user'
        }) as UserPayload

        const token = await JwtToken.create(createdUser, reply)

        const { password: _, ...userPayload } = createdUser as UserTokenPayload

        return reply.status(201).send({ user: userPayload, token })
    }

    static async login(req: FastifyRequest, reply: FastifyReply)
    {
    
    }
}