import type { UserStatsDTO } from '../../shared/dto/user-stats.dto.js';
import { AppError } from '../../shared/errors/app-error.js';
import { cursorPaginate } from '../../shared/utils/pagination/cursor-paginate.js';
import prisma from '../../shared/utils/prisma/prisma_conn.js';

export class UsersService {
    static async getUserByUsername(username: string, currentUserId?: number) {
        const user = await prisma.user.findUnique({
            where: { username: username ?? undefined },
            include: { profile: true },
        });

        if (!user || !user.activate) throw AppError.throw('Usuário não encontrado.', 404);

        let isFollowing = false;
        if (currentUserId) {
            const follow = await prisma.userFollow.findFirst({
                where: { followerId: currentUserId, followingId: user.id },
            });
            isFollowing = !!follow;
        }

        const { password, ...safeUser } = user;
        return {
            id: safeUser.id,
            username: safeUser.username,
            bio: safeUser.profile?.bio ?? null,
            photo: safeUser.profile?.photo ?? null,
            banner: safeUser.profile?.banner ?? null,
            followersCount: safeUser.profile?.followersCount ?? 0,
            followingCount: safeUser.profile?.followingCount ?? 0,
            createdAt: safeUser.createdAt,
            isFollowing,
        };
    }

    static async getUserByFriendlyId(friendlyId: string, currentUserId?: number) {
        const user = await prisma.user.findFirst({
            where: { profile: { friendlyId } },
            include: { profile: true },
        });

        if (!user || !user.activate) throw AppError.throw('Usuário não encontrado.', 404);

        let isFollowing = false;
        if (currentUserId) {
            const follow = await prisma.userFollow.findFirst({
                where: { followerId: currentUserId, followingId: user.id },
            });
            isFollowing = !!follow;
        }

        const { password, ...safeUser } = user;
        return {
            id: safeUser.id,
            username: safeUser.username,
            bio: safeUser.profile?.bio ?? null,
            photo: safeUser.profile?.photo ?? null,
            banner: safeUser.profile?.banner ?? null,
            followersCount: safeUser.profile?.followersCount ?? 0,
            followingCount: safeUser.profile?.followingCount ?? 0,
            createdAt: safeUser.createdAt,
            isFollowing,
        };
    }

    static async getUserReviews(username: string, cursor?: string) {
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) throw AppError.throw('Usuário não encontrado.', 404);

        const { data, nextCursor } = await cursorPaginate({
            findMany: (args) =>
                prisma.review.findMany({
                    ...args,
                    where: { userId: user.id, status: 'approved' },
                    include: { game: { select: { id: true, title: true, cover: true } } },
                    orderBy: { createdAt: 'desc' },
                }),
            take: 10,
            cursor,
        });

        return { reviews: data, nextCursor };
    }

    static async getUserStats(username: string): Promise<UserStatsDTO> {
        const user = await prisma.user.findUnique({
            where: { username },
            include: { profile: true },
        });
        if (!user) throw AppError.throw('Usuário não encontrado.', 404);

        const [reviews] = await Promise.all([
            prisma.review.aggregate({
                where: { userId: user.id, status: 'approved' },
                _avg: { rating: true },
                _count: true,
            }),
        ]);

        const totalGames = await prisma.userGameListItem.count({
            where: { list: { userId: user.id } },
        });

        return {
            totalReviews: reviews._count,
            averageRating: reviews._avg.rating,
            totalGames,
            followersCount: user.profile?.followersCount ?? 0,
            followingCount: user.profile?.followingCount ?? 0,
            memberSince: user.createdAt,
        };
    }

    static async getUserLists(username: string) {
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) throw AppError.throw('Usuário não encontrado.', 404);

        const lists = await prisma.userGameList.findMany({
            where: { userId: user.id, isPublic: true },
            include: {
                items: { include: { game: { select: { id: true, title: true, cover: true } } } },
            },
            orderBy: { id: 'asc' },
        });

        return { lists };
    }
}
