import type { Prisma } from '../../../generated/client.js';

export async function detachUserSocialGraph(tx: Prisma.TransactionClient, userId: number) {
    const follows = await tx.userFollow.findMany({
        where: { OR: [{ followerId: userId }, { followingId: userId }] },
        select: { followerId: true, followingId: true },
    });
    if (follows.length > 0) {
        await tx.userFollow.deleteMany({
            where: { OR: [{ followerId: userId }, { followingId: userId }] },
        });
    }

    const followingIds = follows
        .filter((follow) => follow.followerId === userId)
        .map((follow) => follow.followingId);
    if (followingIds.length > 0) {
        await tx.userProfile.updateMany({
            where: { userId: { in: followingIds }, followersCount: { gt: 0 } },
            data: { followersCount: { decrement: 1 } },
        });
    }

    const followerIds = follows
        .filter((follow) => follow.followingId === userId)
        .map((follow) => follow.followerId);
    if (followerIds.length > 0) {
        await tx.userProfile.updateMany({
            where: { userId: { in: followerIds }, followingCount: { gt: 0 } },
            data: { followingCount: { decrement: 1 } },
        });
    }

    await tx.userProfile.updateMany({
        where: { userId },
        data: { followersCount: 0, followingCount: 0 },
    });
    await tx.notification.deleteMany({
        where: {
            type: 'follow',
            OR: [{ toUserId: userId }, { fromUserId: userId }],
        },
    });
}
