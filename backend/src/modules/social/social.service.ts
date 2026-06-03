import { AppError } from '../../shared/errors/app-error.js';
import { cursorPaginate } from '../../shared/utils/pagination/cursor-paginate.js';
import prisma from '../../shared/utils/prisma/prisma_conn.js';

export class SocialService {
    static async followUser(followerId: number, targetUsername: string) {
        const target = await prisma.user.findUnique({ where: { username: targetUsername } });
        if (!target) throw AppError.throw('Usuário não encontrado.', 404);
        if (target.id === followerId) throw AppError.throw('Você não pode seguir a si mesmo.', 400);

        const exists = await prisma.userFollow.findFirst({
            where: { followerId, followingId: target.id },
        });
        if (exists) throw AppError.throw('Você já segue este usuário.', 409);

        await prisma.$executeRaw`SELECT follow_user(${followerId}::int, ${target.id}::int)`;

        return { message: `Você começou a seguir ${target.username ?? target.email}.` };
    }

    static async unfollowUser(followerId: number, targetUsername: string) {
        const target = await prisma.user.findUnique({ where: { username: targetUsername } });
        if (!target) throw AppError.throw('Usuário não encontrado.', 404);
        if (target.id === followerId)
            throw AppError.throw('Você não pode deixar de seguir a si mesmo.', 400);

        const exists = await prisma.userFollow.findFirst({
            where: { followerId, followingId: target.id },
        });
        if (!exists) throw AppError.throw('Você não segue este usuário.', 404);

        await prisma.userFollow.delete({
            where: { followerId_followingId: { followerId, followingId: target.id } },
        });

        return { message: `Você deixou de seguir ${target.username ?? target.email}.` };
    }

    static async getFollowers(username: string, currentUserId?: number, cursor?: string) {
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) throw AppError.throw('Usuário não encontrado.', 404);

        const { data: follows, nextCursor } = await cursorPaginate({
            findMany: (args) =>
                prisma.userFollow.findMany({
                    ...args,
                    where: { followingId: user.id },
                    orderBy: { timestamp: 'desc' },
                }),
            take: 10,
            cursor,
        });

        const followerIds = follows.map((f) => f.followerId);
        const profiles = await prisma.user.findMany({
            where: { id: { in: followerIds } },
            include: { profile: { select: { photo: true } } },
        });

        let followingIds = new Set<number>();
        if (currentUserId) {
            const followingBack = await prisma.userFollow.findMany({
                where: { followerId: currentUserId, followingId: { in: followerIds } },
                select: { followingId: true },
            });
            followingIds = new Set(followingBack.map((f) => f.followingId));
        }

        return {
            followers: profiles.map((p) => ({
                id: p.id,
                username: p.username,
                photo: p.profile?.photo ?? null,
                isFollowing: followingIds.has(p.id),
            })),
            nextCursor,
        };
    }

    static async getFollowing(username: string, currentUserId?: number, cursor?: string) {
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) throw AppError.throw('Usuário não encontrado.', 404);

        const { data: follows, nextCursor } = await cursorPaginate({
            findMany: (args) =>
                prisma.userFollow.findMany({
                    ...args,
                    where: { followerId: user.id },
                    orderBy: { timestamp: 'desc' },
                }),
            take: 10,
            cursor,
        });

        const followingIds = follows.map((f) => f.followingId);
        const profiles = await prisma.user.findMany({
            where: { id: { in: followingIds } },
            include: { profile: { select: { photo: true } } },
        });

        let followingBackIds = new Set<number>();
        if (currentUserId) {
            const followingBack = await prisma.userFollow.findMany({
                where: { followerId: currentUserId, followingId: { in: followingIds } },
                select: { followingId: true },
            });
            followingBackIds = new Set(followingBack.map((f) => f.followingId));
        }

        return {
            following: profiles.map((p) => ({
                id: p.id,
                username: p.username,
                photo: p.profile?.photo ?? null,
                isFollowing: followingBackIds.has(p.id),
            })),
            nextCursor,
        };
    }

    static async getFeed(userId: number, cursor?: string) {
        const following = await prisma.userFollow.findMany({
            where: { followerId: userId },
            select: { followingId: true },
        });
        const followingIds = following.map((f) => f.followingId);
        if (followingIds.length === 0) return { feed: [], nextCursor: null };

        const { data, nextCursor } = await cursorPaginate({
            findMany: (args) =>
                prisma.review.findMany({
                    ...args,
                    where: { userId: { in: followingIds }, status: 'approved' },
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
                    orderBy: { createdAt: 'desc' },
                }),
            take: 10,
            cursor,
        });

        const feed = data.map((r) => ({
            id: r.id,
            type: 'review' as const,
            userId: r.userId,
            userUsername: r.user.username,
            userPhoto: r.user.profile?.photo ?? null,
            createdAt: r.createdAt,
            review: {
                id: r.id,
                gameId: r.gameId,
                gameTitle: r.game.title,
                gameCover: r.game.cover,
                rating: r.rating,
                text: r.text,
            },
        }));

        return { feed, nextCursor };
    }
}
