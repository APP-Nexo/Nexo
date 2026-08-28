import type { Prisma } from '../../../generated/client.js';

export async function applyRatingDelta(
    tx: Prisma.TransactionClient,
    gameId: number,
    ratingDelta: number,
    countDelta: number,
) {
    if (ratingDelta === 0 && countDelta === 0) return;

    const data: Prisma.GameUpdateInput = {};
    if (ratingDelta > 0) data.ratingSum = { increment: ratingDelta };
    if (ratingDelta < 0) data.ratingSum = { decrement: Math.abs(ratingDelta) };
    if (countDelta > 0) data.ratingCount = { increment: countDelta };
    if (countDelta < 0) data.ratingCount = { decrement: Math.abs(countDelta) };

    const totals = await tx.game.update({
        where: { id: gameId },
        data,
        select: { ratingSum: true, ratingCount: true },
    });

    await tx.game.update({
        where: { id: gameId },
        data: {
            averageRating: totals.ratingCount > 0 ? totals.ratingSum / totals.ratingCount : 0,
        },
    });
}

export async function recalculateRatingsForUser(tx: Prisma.TransactionClient, userId: number) {
    const affectedGames = await tx.review.findMany({
        where: { userId, status: 'approved', deletedAt: null },
        select: { gameId: true },
        distinct: ['gameId'],
    });

    for (const { gameId } of affectedGames) {
        const ratings = await tx.review.aggregate({
            where: {
                gameId,
                status: 'approved',
                deletedAt: null,
                user: { activate: true, deletedAt: null, blockedUser: null },
            },
            _sum: { rating: true },
            _count: true,
        });
        const ratingSum = ratings._sum.rating ?? 0;
        await tx.game.update({
            where: { id: gameId },
            data: {
                ratingSum,
                ratingCount: ratings._count,
                averageRating: ratings._count > 0 ? ratingSum / ratings._count : 0,
            },
        });
    }
}
