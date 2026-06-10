import type { UserPublicSimple } from '../../shared/dto/index.js';
import type { PaginatedResponse, UsersListResponse } from '../../shared/dto/pagination.dto.js';
import { AppError } from '../../shared/errors/app-error.js';
import { cursorPaginate } from '../../shared/utils/pagination/cursor-paginate.js';
import prisma from '../../shared/utils/prisma/prisma_conn.js';

export class AdminService {
    static async getDashboard() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [
            totalUsers,
            totalReviews,
            totalGames,
            activeToday,
            pendingReviews,
            pendingReports,
            topGames,
        ] = await Promise.all([
            prisma.user.count({ where: { activate: true } }),
            prisma.review.count(),
            prisma.game.count(),
            prisma.user.count({ where: { createdAt: { gte: today } } }),
            prisma.review.count({ where: { status: 'pending' } }),
            prisma.report.count({ where: { status: 'pending' } }),
            prisma.review.groupBy({
                by: ['gameId'],
                _count: true,
                orderBy: { _count: { gameId: 'desc' } },
                take: 5,
            }),
        ]);

        const gameIds = topGames.map((g) => g.gameId);
        const games =
            gameIds.length > 0
                ? await prisma.game.findMany({
                      where: { id: { in: gameIds } },
                      select: { id: true, title: true, cover: true },
                  })
                : [];

        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);
            return d;
        }).reverse();

        const recentActivity = await Promise.all(
            last7Days.map(async (date) => {
                const nextDay = new Date(date);
                nextDay.setDate(nextDay.getDate() + 1);
                const [newUsers, newReviews] = await Promise.all([
                    prisma.user.count({ where: { createdAt: { gte: date, lt: nextDay } } }),
                    prisma.review.count({ where: { createdAt: { gte: date, lt: nextDay } } }),
                ]);
                return { date: date.toISOString().split('T')[0]!, newUsers, newReviews };
            }),
        );

        return {
            totalUsers,
            totalReviews,
            totalGames,
            activeToday,
            pendingReviews,
            pendingReports,
            topGames: games.map((g) => ({
                id: g.id,
                title: g.title,
                cover: g.cover,
                reviewCount: topGames.find((tg) => tg.gameId === g.id)?._count ?? 0,
            })),
            recentActivity,
        };
    }

    static async getUsersStats() {
        const stats = await prisma.vwUsersStatusSummary.findFirst();
        return { usersStatus: stats };
    }

    static async getUsersAdmin(): Promise<UsersListResponse<UserPublicSimple>> {
        const users = await prisma.vwUserPublic.findMany({
            where: { roleId: 2 },
            select: {
                id: true,
                friendlyId: true,
                email: true,
                photo: true,
                createdAt: true,
                roleId: true,
            },
        });
        return { users, nextCursor: null };
    }

    static async searchUser(
        query?: string,
        cursor?: string,
    ): Promise<PaginatedResponse<UserPublicSimple>> {
        if (!query) return { users: [], nextCursor: null };

        const { data, nextCursor } = await cursorPaginate({
            findMany: (args) =>
                prisma.vwUserPublic.findMany({
                    ...args,
                    where: {
                        OR: [{ email: { contains: query, mode: 'insensitive' } }],
                    },
                    select: {
                        id: true,
                        friendlyId: true,
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
        limit = 10,
    ): Promise<PaginatedResponse<UserPublicSimple>> {
        const { data, nextCursor } = await cursorPaginate({
            findMany: (args) =>
                prisma.vwUserPublic.findMany({
                    ...args,
                    select: {
                        id: true,
                        friendlyId: true,
                        email: true,
                        photo: true,
                        createdAt: true,
                        roleId: true,
                    },
                    orderBy: { createdAt: 'desc' },
                }),
            take: limit,
            cursor,
        });

        return { users: data, nextCursor };
    }

    static async getUserDetail(id: number) {
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                profile: {
                    select: { photo: true, bio: true, followersCount: true, followingCount: true },
                },
                blockedUser: { select: { reason: true, createdAt: true } },
                reviews: {
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    include: { game: { select: { title: true } } },
                },
            },
        });
        if (!user) throw AppError.throw('Usuário não encontrado.', 404);

        const { password, ...safe } = user;
        return { ...safe, isBlocked: !!user.blockedUser };
    }

    static async blockUser(userId: number, adminId: number, reason?: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw AppError.throw('Usuário não encontrado.', 404);

        const existing = await prisma.blockedUser.findUnique({ where: { userId } });
        if (existing) throw AppError.throw('Usuário já está bloqueado.', 409);

        await prisma.blockedUser.create({
            data: { userId, blockedById: adminId, reason: reason ?? null },
        });
        return { message: 'Usuário bloqueado.' };
    }

    static async unblockUser(userId: number) {
        const existing = await prisma.blockedUser.findUnique({ where: { userId } });
        if (!existing) throw AppError.throw('Usuário não está bloqueado.', 404);

        await prisma.blockedUser.delete({ where: { userId } });
        return { message: 'Usuário desbloqueado.' };
    }

    static async deleteUser(userId: number) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw AppError.throw('Usuário não encontrado.', 404);

        await prisma.user.update({
            where: { id: userId },
            data: {
                activate: false,
                deletedAt: new Date(),
                email: `deleted_admin_${userId}_${user.email}`,
            },
        });
        return { message: 'Usuário deletado.' };
    }

    static async getReviews(status?: string, cursor?: string) {
        const reviewStatus =
            status && ['pending', 'approved', 'rejected'].includes(status) ? status : 'pending';

        const { data, nextCursor } = await cursorPaginate({
            findMany: (args) =>
                prisma.review.findMany({
                    ...args,
                    where: { status: reviewStatus as 'pending' | 'approved' | 'rejected' },
                    include: {
                        user: { select: { id: true, username: true, email: true } },
                        game: { select: { id: true, title: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                }),
            take: 10,
            cursor,
        });

        return { reviews: data, nextCursor };
    }

    static async deleteReview(reviewId: number) {
        const review = await prisma.review.findUnique({ where: { id: reviewId } });
        if (!review) throw AppError.throw('Review não encontrada.', 404);

        await prisma.review.delete({ where: { id: reviewId } });
        return { message: 'Review removida.' };
    }

    static async getReports() {
        const reports = await prisma.report.findMany({
            where: { status: 'pending' },
            include: {
                reporter: { select: { id: true, username: true } },
                review: {
                    select: {
                        id: true,
                        rating: true,
                        text: true,
                        user: { select: { id: true, username: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        return { reports };
    }

    static async resolveReport(reportId: number) {
        const report = await prisma.report.findUnique({ where: { id: reportId } });
        if (!report) throw AppError.throw('Denúncia não encontrada.', 404);

        await prisma.report.update({ where: { id: reportId }, data: { status: 'resolved' } });
        return { message: 'Denúncia resolvida.' };
    }
}
