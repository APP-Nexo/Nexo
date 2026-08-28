import { AppError } from '../../shared/errors/app-error.js';
import { runSerializableTransaction } from '../../shared/infrastructure/database/transactions.js';
import { normalizePrismaCursor } from '../../shared/infrastructure/validation/prisma-values.js';
import { cursorPaginate } from '../../shared/utils/pagination/cursor-paginate.js';
import prisma from '../../shared/utils/prisma/prisma_conn.js';

const ACTIVE_USER_FILTER = {
    activate: true,
    deletedAt: null,
    blockedUser: null,
} as const;

type Cursor = string | number | undefined;
async function findActiveUser(username: string) {
    const user = await prisma.user.findUnique({
        where: { username },
        select: {
            id: true,
            username: true,
            activate: true,
            deletedAt: true,
            blockedUser: { select: { id: true } },
        },
    });

    if (!user?.activate || user.deletedAt || user.blockedUser) {
        AppError.throw('Usuário não encontrado.', 404);
    }
    return user;
}

export class SocialService {
    static async followUser(followerId: number, targetUsername: string) {
        const target = await findActiveUser(targetUsername);
        if (target.id === followerId) {
            AppError.throw('Você não pode seguir a si mesmo.', 400);
        }

        await runSerializableTransaction(prisma, async (tx) => {
            const activeUsers = await tx.user.count({
                where: { id: { in: [followerId, target.id] }, ...ACTIVE_USER_FILTER },
            });
            if (activeUsers !== 2) {
                AppError.throw('Uma das contas não está disponível.', 409);
            }

            const inserted = await tx.userFollow.createMany({
                data: { followerId, followingId: target.id },
                skipDuplicates: true,
            });

            if (inserted.count === 0) return;

            await tx.userProfile.update({
                where: { userId: followerId },
                data: { followingCount: { increment: 1 } },
            });
            await tx.userProfile.update({
                where: { userId: target.id },
                data: { followersCount: { increment: 1 } },
            });
            await tx.notification.create({
                data: {
                    type: 'follow',
                    toUserId: target.id,
                    fromUserId: followerId,
                    entityType: 'user',
                    entityId: followerId,
                    metadata: { followerId },
                },
            });
        });

        return { message: `Você começou a seguir ${target.username}.` };
    }

    static async unfollowUser(followerId: number, targetUsername: string) {
        const target = await prisma.user.findUnique({
            where: { username: targetUsername },
            select: { id: true, username: true },
        });
        if (!target) AppError.throw('Usuário não encontrado.', 404);
        if (target.id === followerId) {
            AppError.throw('Você não pode deixar de seguir a si mesmo.', 400);
        }

        await runSerializableTransaction(prisma, async (tx) => {
            const removed = await tx.userFollow.deleteMany({
                where: { followerId, followingId: target.id },
            });
            if (removed.count === 0) {
                AppError.throw('Você não segue este usuário.', 404);
            }

            await tx.userProfile.updateMany({
                where: { userId: followerId, followingCount: { gt: 0 } },
                data: { followingCount: { decrement: 1 } },
            });
            await tx.userProfile.updateMany({
                where: { userId: target.id, followersCount: { gt: 0 } },
                data: { followersCount: { decrement: 1 } },
            });
            await tx.notification.deleteMany({
                where: {
                    type: 'follow',
                    toUserId: target.id,
                    fromUserId: followerId,
                    read: false,
                },
            });
        });

        return { message: `Você deixou de seguir ${target.username}.` };
    }

    static async getFollowers(username: string, currentUserId?: number, cursor?: Cursor) {
        const user = await findActiveUser(username);

        const { data: follows, nextCursor } = await cursorPaginate({
            findMany: (args) =>
                prisma.userFollow.findMany({
                    ...args,
                    where: {
                        followingId: user.id,
                        follower: ACTIVE_USER_FILTER,
                    },
                    select: {
                        id: true,
                        followerId: true,
                        follower: {
                            select: {
                                id: true,
                                username: true,
                                profile: { select: { photo: true } },
                            },
                        },
                    },
                    orderBy: [{ timestamp: 'desc' }, { id: 'desc' }],
                }),
            take: 10,
            cursor: normalizePrismaCursor(cursor),
        });

        const followerIds = follows.map((follow) => follow.followerId);
        const followedByViewer =
            currentUserId !== undefined && followerIds.length > 0
                ? await prisma.userFollow.findMany({
                      where: { followerId: currentUserId, followingId: { in: followerIds } },
                      select: { followingId: true },
                  })
                : [];
        const followedIds = new Set(followedByViewer.map((follow) => follow.followingId));

        return {
            followers: follows.map((follow) => ({
                id: follow.follower.id,
                username: follow.follower.username,
                photo: follow.follower.profile?.photo ?? null,
                isFollowing: followedIds.has(follow.followerId),
            })),
            nextCursor,
        };
    }

    static async getFollowing(username: string, currentUserId?: number, cursor?: Cursor) {
        const user = await findActiveUser(username);

        const { data: follows, nextCursor } = await cursorPaginate({
            findMany: (args) =>
                prisma.userFollow.findMany({
                    ...args,
                    where: {
                        followerId: user.id,
                        following: ACTIVE_USER_FILTER,
                    },
                    select: {
                        id: true,
                        followingId: true,
                        following: {
                            select: {
                                id: true,
                                username: true,
                                profile: { select: { photo: true } },
                            },
                        },
                    },
                    orderBy: [{ timestamp: 'desc' }, { id: 'desc' }],
                }),
            take: 10,
            cursor: normalizePrismaCursor(cursor),
        });

        const followingIds = follows.map((follow) => follow.followingId);
        const followedByViewer =
            currentUserId !== undefined && followingIds.length > 0
                ? await prisma.userFollow.findMany({
                      where: { followerId: currentUserId, followingId: { in: followingIds } },
                      select: { followingId: true },
                  })
                : [];
        const followedIds = new Set(followedByViewer.map((follow) => follow.followingId));

        return {
            following: follows.map((follow) => ({
                id: follow.following.id,
                username: follow.following.username,
                photo: follow.following.profile?.photo ?? null,
                isFollowing: followedIds.has(follow.followingId),
            })),
            nextCursor,
        };
    }

    static async getFeed(userId: number, cursor?: Cursor) {
        const followingCount = await prisma.userFollow.count({
            where: { followerId: userId, following: ACTIVE_USER_FILTER },
        });
        const discovery = followingCount === 0;

        const { data, nextCursor } = await cursorPaginate({
            findMany: (args) =>
                prisma.review.findMany({
                    ...args,
                    where: {
                        status: 'approved',
                        deletedAt: null,
                        user: discovery
                            ? ACTIVE_USER_FILTER
                            : {
                                  ...ACTIVE_USER_FILTER,
                                  followers: { some: { followerId: userId } },
                              },
                        ...(discovery ? { userId: { not: userId } } : {}),
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                profile: { select: { photo: true } },
                            },
                        },
                        game: { select: { id: true, title: true, cover: true } },
                    },
                    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
                }),
            take: 10,
            cursor: normalizePrismaCursor(cursor),
        });

        const feed = data.map((review) => ({
            id: review.id,
            type: 'review' as const,
            userId: review.userId,
            userUsername: review.user.username,
            userPhoto: review.user.profile?.photo ?? null,
            createdAt: review.createdAt,
            review: {
                id: review.id,
                gameId: review.gameId,
                gameTitle: review.game.title,
                gameCover: review.game.cover,
                rating: review.rating,
                text: review.text,
            },
        }));

        return { feed, nextCursor };
    }
}
