import type { FastifyRequest, FastifyReply } from 'fastify';

import { UserErrors } from '../helpers/errors/user-erros.js';
import { encryptPassword } from '../helpers/utils/encrypt_password.js';

import { Prisma } from '../generated/client.js'
import type { UserTokenPayload } from '../helpers/interfaces/I-Jwt.js';
import type { VwUserPublic } from '../generated/client.js';

import { GenericQueries } from '../repository/generics.js';
import prisma from '../helpers/utils/prisma_conn.js';
import type { UserPayload } from '../helpers/interfaces/I-Auth.js';
const userQuery = new GenericQueries(prisma.user)

const vwUserQuery = new GenericQueries<VwUserPublic>(prisma.vwUserPublic)

export class UserController 
{
    // =========================================================
    //  promoteUser: @update
    // =========================================================
    static async update(req: FastifyRequest, reply: FastifyReply) // feature
    {

    }

    // ==============================================
    //  @get 
    //  @returns: { users: data, nextCursor, total }
    //  @status:  200 OK
    // ==============================================
    static async searchUser(req: FastifyRequest, reply: FastifyReply)
    {
        const { find, cursor } = req.query as { find?: string; cursor?: string }
        const tokenJwt = req.user as UserPayload

        if (!find) return reply.status(200).send({ users: [], nextCursor: null })

        const where = {
            OR: [
                { name: { startsWith: find, mode: Prisma.QueryMode.insensitive } },
                { friendlyId: { equals: find } },
            ],
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
            prisma.vwUserPublic.count({ where }),
        ])

        const data = users.slice(0, 10)

        const following = await prisma.userFollow.findMany({
            where: {
            followerId: tokenJwt.id,
            followingId: { in: data.map((u) => u.id) },
            },
            select: { followingId: true },
        })

        const followingIds = new Set(following.map((f) => f.followingId))
        const nextCursor = users.length === 11 ? users[10]?.id ?? null : null

        return reply.status(200).send({
            users: data.map((user) => ({ ...user, isFollowing: followingIds.has(user.id) })),
            nextCursor,
            total,
        })
    }
    // ================================================================================================================
    //  @get 
    //  @returns: user: { ...userData, isFollowing: !!isFollowing },
    //            profile: { friendlyId, photo, banner, bio, config, followersCount, followingCount },
    //  @status:  200 OK
    // ================================================================================================================
    static async getUser(req: FastifyRequest, reply: FastifyReply)
    {
        const { id } = req.params as { id: number }
        const tokenJwt = req.user as UserPayload

        await UserErrors.ensureUserExistById(vwUserQuery, Number(id))

        const user = await vwUserQuery.findUnique({ id: Number(id) })
        const isFollowing = await prisma.userFollow.findFirst({ where: { followerId: tokenJwt.id, followingId: id } })

        const { photo, banner, bio, config, friendlyId, followersCount, followingCount, ...userData } = user as any

        return reply.status(200).send({
            user: { ...userData, isFollowing: !!isFollowing },
            profile: { friendlyId, photo, banner, bio, config, followersCount, followingCount },
        })
    }

    // ================================================================================================================
    //  @patch 
    //  @returns: { message: 'Conta deletada.',  deletedAt: new Date().toISOString(), email: tokenUser.email }
    //  @status:  200 OK
    // ================================================================================================================
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

        return reply.status(200).send({ message: 'Conta deletada.',  deletedAt: new Date().toISOString(), email: tokenUser.email })
    }
}