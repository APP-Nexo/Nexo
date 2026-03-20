import type { FastifyRequest, FastifyReply } from 'fastify';

import { UserErrors } from '../helpers/errors/user-erros.js';
import { encryptPassword } from '../helpers/utils/encrypt_password.js';

import type { UserTokenPayload } from '../helpers/interfaces/I-Jwt.js';

import { GenericQueries } from '../repository/generics.js';
import prisma from '../helpers/utils/prisma_conn.js';
const userQuery = new GenericQueries(prisma.user)
const userProfileQuery = new GenericQueries(prisma.userProfile)

export class UserController 
{
    static async update(req: FastifyRequest, reply: FastifyReply)
    {

    }
    
    static async getUser(req: FastifyRequest, reply: FastifyReply)
    {

    }

    static async getUsers(req: FastifyRequest, reply: FastifyReply)
    {

    }

    static async delete(req: FastifyRequest, reply: FastifyReply)
    {
        const { email } = req.body as { email: string}
        const tokenUser = req.user as UserTokenPayload

        UserErrors.ensureDelete(email, tokenUser)
        await UserErrors.ensureUserActive(userQuery, tokenUser.id)

        await userQuery.update(tokenUser.id, { activate: false, email: `deleted_${tokenUser.id}_${tokenUser.email}` })

        return reply.status(200).send({ message: 'Conta deletada.' })
    }
}