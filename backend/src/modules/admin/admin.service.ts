import type { UserPublicSimple } from '../../shared/dto/index.js';
import type { PaginatedResponse, UsersListResponse } from '../../shared/dto/pagination.dto.js';
import { cursorPaginate } from '../../shared/utils/pagination/cursor-paginate.js';
import prisma from '../../shared/utils/prisma/prisma_conn.js';

export class AdminService {
    static async getUsersStats() {
        const stats = await prisma.vwUsersStatusSummary.findFirst();
        return { usersStatus: stats };
    }

    static async getUsersAdmin(): Promise<UsersListResponse<UserPublicSimple>> {
        const users = await prisma.vwUserPublic.findMany({
            where: { roleId: 2 },
            select: {
                id: true,
                name: true,
                email: true,
                photo: true,
                createdAt: true,
                friendlyId: true,
                roleId: true,
            },
        });
        return { users, nextCursor: null };
    }

    static async searchUser(
        email?: string,
        cursor?: string,
    ): Promise<PaginatedResponse<UserPublicSimple>> {
        if (!email) return { users: [], nextCursor: null };

        const { data, nextCursor } = await cursorPaginate<UserPublicSimple>({
            findMany: (args) =>
                prisma.vwUserPublic.findMany({
                    ...args,
                    where: {
                        email: { contains: email, mode: 'insensitive' },
                    },
                    select: {
                        id: true,
                        friendlyId: true,
                        name: true,
                        email: true,
                        photo: true,
                        createdAt: true,
                        roleId: true,
                    },
                    orderBy: { id: 'asc' },
                }),
            take: 10,
            cursor,
        });

        return { users: data, nextCursor };
    }

    static async getUsers(
        cursor?: string,
        limit: number = 10,
    ): Promise<PaginatedResponse<UserPublicSimple>> {
        const { data, nextCursor } = await cursorPaginate<UserPublicSimple>({
            findMany: (args) =>
                prisma.vwUserPublic.findMany({
                    ...args,
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        photo: true,
                        createdAt: true,
                        friendlyId: true,
                        roleId: true,
                    },
                    orderBy: { createdAt: 'desc' },
                }),
            take: limit,
            cursor,
        });

        return { users: data, nextCursor };
    }
}
