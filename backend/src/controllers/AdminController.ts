import type { FastifyRequest, FastifyReply } from 'fastify';

import type { VwUserPublic, VwUsersStatusSummary } from '../generated/client.js';

import { GenericQueries } from '../repository/generics.js';
import prisma from '../helpers/utils/prisma_conn.js';
const vwUserQuery = new GenericQueries<VwUserPublic>(prisma.vwUserPublic)
const vwUserStatsQuery = new GenericQueries<VwUsersStatusSummary>(prisma.vwUsersStatusSummary)

export class AdminController
{
    static async getUsersStats(req: FastifyRequest, reply: FastifyReply) {
        const stats = await vwUserStatsQuery.findFirst()
        return reply.status(200).send({ usersStatus: stats })
    }

    static async searchUser(req: FastifyRequest, reply: FastifyReply) 
    {
        const { search, cursor } = req.query as { search?: string, cursor?: string }

        if (!search) return reply.status(200).send({ users: [], nextCursor: null })

        const take = 11

        const users = await vwUserQuery.findManyWithOptions({
            where: {
            email: { contains: search, mode: 'insensitive' }
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