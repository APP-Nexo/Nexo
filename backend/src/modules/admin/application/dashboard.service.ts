import prisma from '../../../shared/utils/prisma/prisma_conn.js';

export class AdminDashboardService {
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
            prisma.user.count({ where: { activate: true, deletedAt: null } }),
            prisma.review.count({
                where: {
                    status: 'approved',
                    deletedAt: null,
                    user: { activate: true, deletedAt: null, blockedUser: null },
                },
            }),
            prisma.game.count(),
            prisma.user.count({
                where: { activate: true, deletedAt: null, createdAt: { gte: today } },
            }),
            prisma.review.count({ where: { status: 'pending', deletedAt: null } }),
            prisma.report.count({ where: { status: 'pending' } }),
            prisma.review.groupBy({
                by: ['gameId'],
                where: {
                    status: 'approved',
                    deletedAt: null,
                    user: { activate: true, deletedAt: null, blockedUser: null },
                },
                _count: { gameId: true },
                orderBy: { _count: { gameId: 'desc' } },
                take: 5,
            }),
        ]);

        const gameIds = topGames.map((group) => group.gameId);
        const games =
            gameIds.length > 0
                ? await prisma.game.findMany({
                      where: { id: { in: gameIds } },
                      select: { id: true, title: true, cover: true },
                  })
                : [];
        const gamesById = new Map(games.map((game) => [game.id, game]));

        const last7Days = Array.from({ length: 7 }, (_, index) => {
            const date = new Date();
            date.setDate(date.getDate() - index);
            date.setHours(0, 0, 0, 0);
            return date;
        }).reverse();

        const recentActivity = await Promise.all(
            last7Days.map(async (date) => {
                const nextDay = new Date(date);
                nextDay.setDate(nextDay.getDate() + 1);
                const [newUsers, newReviews] = await Promise.all([
                    prisma.user.count({ where: { createdAt: { gte: date, lt: nextDay } } }),
                    prisma.review.count({
                        where: {
                            status: 'approved',
                            deletedAt: null,
                            user: { activate: true, deletedAt: null, blockedUser: null },
                            createdAt: { gte: date, lt: nextDay },
                        },
                    }),
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
            topGames: topGames.flatMap((group) => {
                const game = gamesById.get(group.gameId);
                return game
                    ? [
                          {
                              ...game,
                              reviewCount: group._count.gameId,
                          },
                      ]
                    : [];
            }),
            recentActivity,
        };
    }

    static async getUsersStats() {
        const [totalUsers, totalActive, totalDeactivated, totalAdmins, totalRegularUsers] =
            await Promise.all([
                prisma.user.count(),
                prisma.user.count({ where: { activate: true, deletedAt: null } }),
                prisma.user.count({
                    where: { OR: [{ activate: false }, { deletedAt: { not: null } }] },
                }),
                prisma.user.count({ where: { role: { is: { role: 'admin' } } } }),
                prisma.user.count({ where: { role: { is: { role: 'user' } } } }),
            ]);

        return {
            usersStatus: {
                totalUsers,
                totalActive,
                totalDeactivated,
                totalAdmins,
                totalRegularUsers,
            },
        };
    }
}
