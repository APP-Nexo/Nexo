import type { UserStatsDTO } from '../../shared/dto/user-stats.dto.js';
import { AppError } from '../../shared/errors/app-error.js';
import { cursorPaginate } from '../../shared/utils/pagination/cursor-paginate.js';
import prisma from '../../shared/utils/prisma/prisma_conn.js';
import type { UserPublicProfile } from './users.interfaces.js';

type UserAvailability = {
    activate: boolean;
    deletedAt: Date | null;
    blockedUser: { id: number } | null;
};
const PRISMA_INT_MAX = 2_147_483_647;

function requireActiveUser<T extends UserAvailability>(user: T | null): T {
    if (!user?.activate || user.deletedAt || user.blockedUser) {
        AppError.throw('Usuário não encontrado.', 404);
    }
    return user;
}

function normalizeCursor(cursor: string | number | undefined): string | undefined {
    if (cursor === undefined) return undefined;

    const parsed = Number(cursor);
    if (!Number.isSafeInteger(parsed) || parsed <= 0 || parsed > PRISMA_INT_MAX) {
        AppError.throw('Cursor inválido.', 400);
    }
    return String(parsed);
}

async function isFollowedByViewer(userId: number, currentUserId?: number): Promise<boolean> {
    if (currentUserId === undefined) return false;

    const follow = await prisma.userFollow.findUnique({
        where: {
            followerId_followingId: { followerId: currentUserId, followingId: userId },
        },
        select: { id: true },
    });
    return follow !== null;
}

export class UsersService {
    static async getUserByUsername(
        username: string,
        currentUserId?: number,
    ): Promise<UserPublicProfile> {
        const user = requireActiveUser(
            await prisma.user.findUnique({
                where: { username },
                select: {
                    id: true,
                    username: true,
                    createdAt: true,
                    activate: true,
                    deletedAt: true,
                    blockedUser: { select: { id: true } },
                    profile: {
                        select: {
                            bio: true,
                            photo: true,
                            banner: true,
                            followersCount: true,
                            followingCount: true,
                        },
                    },
                },
            }),
        );

        return {
            id: user.id,
            username: user.username,
            bio: user.profile?.bio ?? null,
            photo: user.profile?.photo ?? null,
            banner: user.profile?.banner ?? null,
            followersCount: user.profile?.followersCount ?? 0,
            followingCount: user.profile?.followingCount ?? 0,
            createdAt: user.createdAt,
            isFollowing: await isFollowedByViewer(user.id, currentUserId),
        };
    }

    static async getUserByFriendlyId(
        friendlyId: string,
        currentUserId?: number,
    ): Promise<UserPublicProfile> {
        const user = requireActiveUser(
            await prisma.user.findFirst({
                where: { profile: { friendlyId } },
                select: {
                    id: true,
                    username: true,
                    createdAt: true,
                    activate: true,
                    deletedAt: true,
                    blockedUser: { select: { id: true } },
                    profile: {
                        select: {
                            bio: true,
                            photo: true,
                            banner: true,
                            followersCount: true,
                            followingCount: true,
                        },
                    },
                },
            }),
        );

        return {
            id: user.id,
            username: user.username,
            bio: user.profile?.bio ?? null,
            photo: user.profile?.photo ?? null,
            banner: user.profile?.banner ?? null,
            followersCount: user.profile?.followersCount ?? 0,
            followingCount: user.profile?.followingCount ?? 0,
            createdAt: user.createdAt,
            isFollowing: await isFollowedByViewer(user.id, currentUserId),
        };
    }

    static async getUserReviews(username: string, cursor?: string | number) {
        const user = requireActiveUser(
            await prisma.user.findUnique({
                where: { username },
                select: {
                    id: true,
                    activate: true,
                    deletedAt: true,
                    blockedUser: { select: { id: true } },
                },
            }),
        );

        const { data, nextCursor } = await cursorPaginate({
            findMany: (args) =>
                prisma.review.findMany({
                    ...args,
                    where: { userId: user.id, status: 'approved', deletedAt: null },
                    select: {
                        id: true,
                        userId: true,
                        gameId: true,
                        rating: true,
                        text: true,
                        status: true,
                        createdAt: true,
                        updatedAt: true,
                        game: { select: { id: true, title: true, cover: true } },
                    },
                    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
                }),
            take: 10,
            cursor: normalizeCursor(cursor),
        });

        return { reviews: data, nextCursor };
    }

    static async getUserStats(username: string): Promise<UserStatsDTO> {
        const user = requireActiveUser(
            await prisma.user.findUnique({
                where: { username },
                select: {
                    id: true,
                    createdAt: true,
                    activate: true,
                    deletedAt: true,
                    blockedUser: { select: { id: true } },
                    profile: { select: { followersCount: true, followingCount: true } },
                },
            }),
        );

        const [reviews, totalGames] = await Promise.all([
            prisma.review.aggregate({
                where: { userId: user.id, status: 'approved', deletedAt: null },
                _avg: { rating: true },
                _count: true,
            }),
            prisma.userGame.count({ where: { userId: user.id } }),
        ]);

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
        const user = requireActiveUser(
            await prisma.user.findUnique({
                where: { username },
                select: {
                    id: true,
                    activate: true,
                    deletedAt: true,
                    blockedUser: { select: { id: true } },
                },
            }),
        );

        const lists = await prisma.userGameList.findMany({
            where: { userId: user.id, isPublic: true },
            select: {
                id: true,
                userId: true,
                name: true,
                isPublic: true,
                createdAt: true,
                updatedAt: true,
                _count: { select: { items: true } },
                items: {
                    select: {
                        id: true,
                        listId: true,
                        gameId: true,
                        addedAt: true,
                        game: { select: { id: true, title: true, cover: true } },
                    },
                    orderBy: [{ addedAt: 'desc' }, { id: 'desc' }],
                    take: 100,
                },
            },
            orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
            take: 50,
        });

        return {
            lists: lists.map(({ _count, ...list }) => ({
                ...list,
                itemCount: _count?.items ?? list.items.length,
            })),
        };
    }
}
