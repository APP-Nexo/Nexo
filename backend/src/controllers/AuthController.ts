import type { FastifyRequest, FastifyReply } from 'fastify';

import { AuthErrors } from '../helpers/errors/auth-errors.js';
import { JwtToken } from '../helpers/utils/jwt_token.js';
import { encryptPassword } from '../helpers/utils/encrypt_password.js';
import { compare } from 'bcrypt';

import type { RegisterPayload, UserPayload } from '../helpers/interfaces/I-Auth.js';
import type { Role } from '../generated/client.js'

import { GenericQueries } from '../repository/generics.js';
import prisma from '../helpers/utils/prisma_conn.js';
const userQuery = new GenericQueries(prisma.user)
const roleQuery = new GenericQueries<Role>(prisma.role)

export class AuthController 
{
    static async register(req: FastifyRequest, reply: FastifyReply)
    {
        const { name, email, password, confirmPassword } = req.body as RegisterPayload

        AuthErrors.ensureRegister({ name, email, password, confirmPassword })
        await AuthErrors.ensureUserExistByEmail(userQuery, email)

        const defaultRole = await roleQuery.findUnique({ role: 'user' })

        const createdUser = await userQuery.create({
            name,
            email,
            password: await encryptPassword(password),
            roleId: defaultRole?.id,
            profile: {
                create: {} 
            }
        }) as UserPayload

        const token = await JwtToken.create(createdUser, reply)

        return reply.status(201).send({  tokenType: process.env.TOKEN_TYPE!, token, expiresIn: process.env.TOKEN_EXPIRES! })
    }

    static async login(req: FastifyRequest, reply: FastifyReply)
    {
        const { email, password } = req.body as { email: string, password: string };

        AuthErrors.ensureLogin(email, password)
        await AuthErrors.ensureUserNotExist(userQuery, email)

        const user = await userQuery.findUnique({ email }) as UserPayload
        const matchPassword = await compare(password, user.password);

        AuthErrors.ensureMatchPassword(matchPassword)

        const { password: _, ...userPayload } = user as UserPayload;
        const token = await JwtToken.create(userPayload, reply)

        return reply.status(200).send({  tokenType: process.env.TOKEN_TYPE!, token, expiresIn: process.env.TOKEN_EXPIRES! });
    }
}