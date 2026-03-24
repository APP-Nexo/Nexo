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

    static async getUsers(req: FastifyRequest, reply: FastifyReply)
    {
        const { page = 1, limit = 10 } = req.query as { page?: number, limit?: number }

        const skip = (Number(page) - 1) * Number(limit)

        const [users, totalUsers] = await Promise.all([
            vwUserQuery.findManyWithOptions({
                select: {
                    id: true,
                    name: true,
                    email: true,
                    photo: true,
                    createdAt: true
                },
                skip,
                take: Number(limit),
                orderBy: { createdAt: 'desc' }
            }),
            prisma.vwUserPublic.count()
        ])

        return reply.status(200).send({
            users,
            pagination: 
            {
                totalUsers,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(totalUsers / Number(limit))
            }
        })
    }
}