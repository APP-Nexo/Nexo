import type { FastifyRequest, FastifyReply } from 'fastify';

import { UserErrors } from '../helpers/errors/user-erros.js';
import { encryptPassword } from '../helpers/utils/encrypt_password.js';

import { Prisma } from '../generated/client.js'
import type { UserTokenPayload } from '../helpers/interfaces/I-Jwt.js';
import type { VwUserPublic } from '../generated/client.js';

import { GenericQueries } from '../repository/generics.js';
import prisma from '../helpers/utils/prisma_conn.js';
const userQuery = new GenericQueries(prisma.user)
const userProfileQuery = new GenericQueries(prisma.userProfile)

const vwUserQuery = new GenericQueries<VwUserPublic>(prisma.vwUserPublic)

export class UserController 
{
    static async update(req: FastifyRequest, reply: FastifyReply) // feature
    {

    }

    static async searchUser(req: FastifyRequest, reply: FastifyReply) 
    {
        const { search, cursor } = req.query as { search?: string, cursor?: string }

        if (!search) return reply.status(200).send({ users: [], nextCursor: null })

        const where = {
            OR: [
                { name: { startsWith: search, mode: Prisma.QueryMode.insensitive } },
                { friendlyId: { equals: search } }
            ]
        }

        const [users, total] = await Promise.all([
            vwUserQuery.findManyWithOptions({
            where,
            select: {
                id: true,
                friendlyId: true,
                createdAt: true,
                name: true,
                email: true,
                photo: true,
            },
            orderBy: { name: 'asc' },
            take: 11,
            ...(cursor && { cursor: { id: Number(cursor) }, skip: 1 }),
            }),
            prisma.vwUserPublic.count({ where })
        ])

        const nextCursor = users.length === 11 ? users[10]?.id ?? null : null
        const data = users.slice(0, 10)

        return reply.status(200).send({ users: data, nextCursor, total })
    }
    
    static async getUser(req: FastifyRequest, reply: FastifyReply)
    {
        const { id } = req.params as { id: string }

        await UserErrors.ensureUserExistById(vwUserQuery, Number(id))

        const user = await vwUserQuery.findUnique({ id: Number(id) })

        const { photo, banner, bio, config, friendlyId, followersCount, followingCount, ...userData } = user as any

        return reply.status(200).send({
            user: userData,
            profile: { friendlyId, photo, banner, bio, config, followersCount, followingCount }
        })
    }

    static async delete(req: FastifyRequest, reply: FastifyReply)
    {
        const { email } = req.body as { email: string}
        const tokenUser = req.user as UserTokenPayload

        UserErrors.ensureDelete(email, tokenUser)
        await UserErrors.ensureNotMaster(Number(tokenUser.id))
        await UserErrors.ensureUserExistById(vwUserQuery, tokenUser.id)

        await userQuery.update(tokenUser.id, { 
            activate: false, 
            email: `deleted_${tokenUser.id}_${tokenUser.email}`,
            deletedAt: new Date()
        })

        return reply.status(200).send({ message: 'Conta deletada.',  deletedAt: new Date().toISOString(), email: tokenUser.email})
    }
}