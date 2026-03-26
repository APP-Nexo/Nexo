import type { FastifyRequest, FastifyReply } from 'fastify';

import { AdminErrors } from '../helpers/errors/admin-errors.js';

import type { VwUserPublic, VwUsersStatusSummary, Role } from '../generated/client.js';

import { GenericQueries } from '../repository/generics.js';
import prisma from '../helpers/utils/prisma_conn.js';
const vwUserQuery = new GenericQueries<VwUserPublic>(prisma.vwUserPublic)
const vwUserStatsQuery = new GenericQueries<VwUsersStatusSummary>(prisma.vwUsersStatusSummary)
const roleQuery = new GenericQueries<Role>(prisma.role)
const userQuery = new GenericQueries(prisma.user)

export class AdminController
{
    // master routes
    static async promoteUser(req: FastifyRequest, reply: FastifyReply) 
    {
        const { id } = req.params as { id: string }
        await AdminErrors.ensureNotMaster(Number(id))
        await AdminErrors.ensureUserExistById(vwUserQuery, Number(id))

        const adminRole = await roleQuery.findUnique({ role: 'admin' })
        if (!adminRole) return 

        await AdminErrors.ensureRole(Number(id), adminRole.id, 'Usuário ja é admin.')

        await userQuery.update(Number(id), { roleId: adminRole.id })

        return reply.status(200).send({ message: 'Usuário promovido para admin.' })
    }

    static async demoteUser(req: FastifyRequest, reply: FastifyReply) 
    {
        const { id } = req.params as { id: string }
        await AdminErrors.ensureNotMaster(Number(id))
        await AdminErrors.ensureUserExistById(vwUserQuery, Number(id))

        const userRole = await roleQuery.findUnique({ role: 'user' })
        if (!userRole) return

        await AdminErrors.ensureRole(Number(id), userRole.id, 'Usuário ja é user.')

        await userQuery.update(Number(id), { roleId: userRole.id })

        return reply.status(200).send({ message: 'Usuário rebaixado para user.' })
    }

    static async banUser(req: FastifyRequest, reply: FastifyReply) 
    {
        const { id } = req.params as { id: string }
        await AdminErrors.ensureNotMaster(Number(id))
        await AdminErrors.ensureUserExistById(vwUserQuery, Number(id))

        const user = await prisma.user.findUnique({ where: { id: Number(id) } })

        await userQuery.update(Number(id), {
            activate: false,
            email: `banned_${id}_${user?.email}`,
            deletedAt: new Date()
        })

        return reply.status(200).send({ message: 'Usuário banido.' })
    }

    // admin and master routes
    static async getUsersStats(req: FastifyRequest, reply: FastifyReply) {
        const stats = await vwUserStatsQuery.findFirst()
        return reply.status(200).send({ usersStatus: stats })
    }

    static async getUsersAdmin(req: FastifyRequest, reply: FastifyReply)
    {
        const adminRole = await roleQuery.findUnique({ role: 'admin' })
        const users = await vwUserQuery.findMany({ roleId: adminRole?.id })

        const data = users.map(({ photo, banner, bio, friendlyId, config, ...userData }) => ({
        user: userData,
        profile: { photo, banner, bio, friendlyId, config }
        }))

        return reply.status(200).send({ users: data })
    }

    static async searchUser(req: FastifyRequest, reply: FastifyReply) 
    {
        const { email, cursor } = req.query as { email?: string, cursor?: string }

        if (!email) return reply.status(200).send({ users: [], nextCursor: null })

        const take = 11

        const users = await vwUserQuery.findManyWithOptions({
            where: {
            email: { contains: email, mode: 'insensitive' }
            },
            select: {
                id: true,
                friendlyId: true,
                name: true,
                email: true,
                photo: true,
                createdAt: true,
                roleId: true
            },
            orderBy: { id: 'asc' },
            take,
            ...(cursor && { cursor: { id: Number(cursor) }, skip: 1 }),
        })

        const nextCursor = users.length === take ? users[10]?.id ?? null : null
        const data = users.slice(0, 10)

        return reply.status(200).send({ users: data, nextCursor })
    }

    static async getUsers(req: FastifyRequest, reply: FastifyReply) {
        const { cursor, limit = 10 } = req.query as { cursor?: string, limit?: number }

        const take = Number(limit) + 1

        const users = await vwUserQuery.findManyWithOptions({
            select: {
                id: true,
                name: true,
                email: true,
                photo: true,
                createdAt: true,
                roleId: true
            },
            orderBy: { createdAt: 'desc' },
            take,
            ...(cursor && { cursor: { id: Number(cursor) }, skip: 1 }),
        })

        const nextCursor = users.length === take ? users[Number(limit)]?.id ?? null : null
        const data = users.slice(0, Number(limit))

        return reply.status(200).send({ users: data, nextCursor })
    }
}