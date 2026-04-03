import type { VwUserPublic, VwUsersStatusSummary } from '../../generated/client.js';
import { GenericQueries } from '../../shared/repository/generics.js';
import prisma from '../../shared/utils/prisma/prisma_conn.js';

const vwUserQuery = new GenericQueries<VwUserPublic>(prisma.vwUserPublic);
const vwUserStatsQuery = new GenericQueries<VwUsersStatusSummary>(prisma.vwUsersStatusSummary);

export class AdminService {
    static async getUsersStats() 
    {
        const stats = await vwUserStatsQuery.findFirst();
        return { usersStatus: stats };
    }

    static async getUsersAdmin() 
    {
        const users = await prisma.vwUserPublic.findMany({
        where: { roleId: 2 },
        select: {
            id: true,
            name: true,
            email: true,
            photo: true,
            createdAt: true,
            roleId: true
        }
        });
        return { users };
    }

    static async searchUser(email?: string, cursor?: string) 
    {
        if (!email) return { users: [], nextCursor: null };

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
        take: 11,
        ...(cursor && { cursor: { id: Number(cursor) }, skip: 1 }),
        });

        const nextCursor = users.length === 11 ? users[10]?.id ?? null : null;
        const data = users.slice(0, 10);
        return { users: data, nextCursor };
    }

    static async getUsers(cursor?: string, limit: number = 10) {
        const take = limit + 1;

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
        });

        const nextCursor = users.length === take ? users[limit]?.id ?? null : null;
        const data = users.slice(0, limit);
        return { users: data, nextCursor };
    }
}