import type { Prisma } from '../../generated/client.js';
import { AppError } from '../../shared/errors/app-error.js';
import prisma from '../../shared/utils/prisma/prisma_conn.js';
import type {
    CreateReportPayload,
    CreateReviewPayload,
    UpdateReviewPayload,
} from './reviews.interfaces.js';

const reviewSelect = {
    id: true,
    userId: true,
    gameId: true,
    rating: true,
    text: true,
    status: true,
    version: true,
    createdAt: true,
    updatedAt: true,
    user: {
        select: {
            id: true,
            username: true,
            profile: { select: { photo: true } },
        },
    },
    game: {
        select: {
            id: true,
            title: true,
            cover: true,
        },
    },
} satisfies Prisma.ReviewSelect;

const reportSelect = {
    id: true,
    reporterId: true,
    reviewId: true,
    reason: true,
    reviewRating: true,
    reviewText: true,
    reviewCreatedAt: true,
    reviewVersion: true,
    status: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.ReportSelect;

type ReviewWithRelations = Prisma.ReviewGetPayload<{ select: typeof reviewSelect }>;
const PRISMA_INT_MAX = 2_147_483_647;

function hasPrismaCode(error: unknown, code: string): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === code;
}

function normalizeId(id: number, entity: string) {
    if (!Number.isSafeInteger(id) || id < 1 || id > PRISMA_INT_MAX) {
        AppError.throw(`${entity} inválido.`, 400);
    }
}

async function runSerializableTransaction<T>(
    operation: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            return await prisma.$transaction(operation, { isolationLevel: 'Serializable' });
        } catch (error) {
            if (!hasPrismaCode(error, 'P2034') || attempt === 2) throw error;
        }
    }

    throw new Error('Transaction retry limit reached.');
}

async function ensureActiveUser(tx: Prisma.TransactionClient, userId: number) {
    const user = await tx.user.findUnique({
        where: { id: userId },
        select: {
            activate: true,
            deletedAt: true,
            blockedUser: { select: { id: true } },
        },
    });
    if (!user?.activate || user.deletedAt || user.blockedUser) {
        AppError.throw('Conta inativa ou bloqueada.', 403);
    }
}

async function applyRatingDelta(
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

function normalizeRating(rating: number): number {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        AppError.throw('A nota deve ser um número inteiro entre 1 e 5.', 400);
    }
    return rating;
}

function normalizeText(text: string | null | undefined): string | null | undefined {
    if (text === undefined || text === null) return text;
    if (typeof text !== 'string') AppError.throw('O texto da review deve ser uma string.', 400);

    const normalized = text.trim();
    if (normalized.length > 250) {
        AppError.throw('O texto da review deve ter no máximo 250 caracteres.', 400);
    }
    return normalized || null;
}

function normalizeReason(reason: string): string {
    if (typeof reason !== 'string') AppError.throw('O motivo deve ser uma string.', 400);

    const normalized = reason.trim();
    if (normalized.length < 10 || normalized.length > 500) {
        AppError.throw('O motivo deve ter entre 10 e 500 caracteres.', 400);
    }
    return normalized;
}

function toReviewResponse(review: ReviewWithRelations) {
    return {
        id: review.id,
        userId: review.userId,
        gameId: review.gameId,
        rating: review.rating,
        text: review.text,
        status: review.status,
        version: review.version,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        user: {
            id: review.user.id,
            username: review.user.username,
            photo: review.user.profile?.photo ?? null,
        },
        game: review.game,
    };
}

export class ReviewsService {
    static async create(userId: number, gameId: number, payload: CreateReviewPayload) {
        normalizeId(gameId, 'Jogo');
        const rating = normalizeRating(payload.rating);
        const text = normalizeText(payload.text) ?? null;

        try {
            return await runSerializableTransaction(async (tx) => {
                const [game] = await Promise.all([
                    tx.game.findUnique({
                        where: { id: gameId },
                        select: { id: true },
                    }),
                    ensureActiveUser(tx, userId),
                ]);
                if (!game) AppError.throw('Jogo não encontrado.', 404);

                const duplicate = await tx.review.findUnique({
                    where: { userId_gameId: { userId, gameId } },
                    select: {
                        id: true,
                        deletedAt: true,
                        _count: { select: { reports: { where: { status: 'pending' } } } },
                    },
                });
                if (duplicate && !duplicate.deletedAt) {
                    AppError.throw('Você já avaliou este jogo.', 409);
                }
                if (duplicate?._count.reports) {
                    AppError.throw('Esta review ainda possui uma denúncia em análise.', 409);
                }

                const review = duplicate
                    ? await tx.review.update({
                          where: { id: duplicate.id },
                          data: {
                              rating,
                              text,
                              status: 'approved',
                              moderationReason: null,
                              deletedAt: null,
                              version: { increment: 1 },
                          },
                          select: reviewSelect,
                      })
                    : await tx.review.create({
                          data: { userId, gameId, rating, text, status: 'approved' },
                          select: reviewSelect,
                      });

                await applyRatingDelta(tx, gameId, rating, 1);
                return toReviewResponse(review);
            });
        } catch (error) {
            if (hasPrismaCode(error, 'P2002')) {
                AppError.throw('Você já avaliou este jogo.', 409);
            }
            if (hasPrismaCode(error, 'P2003')) AppError.throw('Jogo não encontrado.', 404);
            throw error;
        }
    }

    static async update(userId: number, reviewId: number, payload: UpdateReviewPayload) {
        normalizeId(reviewId, 'Review');
        if (payload.rating === undefined && payload.text === undefined) {
            AppError.throw('Informe ao menos um campo para atualizar.', 400);
        }

        const data: { rating?: number; text?: string | null } = {};
        if (payload.rating !== undefined) data.rating = normalizeRating(payload.rating);
        if (payload.text !== undefined) data.text = normalizeText(payload.text) ?? null;

        try {
            return await runSerializableTransaction(async (tx) => {
                await ensureActiveUser(tx, userId);
                const current = await tx.review.findUnique({
                    where: { id: reviewId },
                    select: {
                        id: true,
                        userId: true,
                        gameId: true,
                        rating: true,
                        status: true,
                        deletedAt: true,
                    },
                });
                if (!current || current.deletedAt) AppError.throw('Review não encontrada.', 404);
                if (current.userId !== userId) {
                    AppError.throw('Você não pode alterar a review de outro usuário.', 403);
                }

                const review = await tx.review.update({
                    where: { id: reviewId },
                    data: { ...data, version: { increment: 1 } },
                    select: reviewSelect,
                });

                if (current.status === 'approved') {
                    await applyRatingDelta(tx, current.gameId, review.rating - current.rating, 0);
                }

                return toReviewResponse(review);
            });
        } catch (error) {
            if (hasPrismaCode(error, 'P2025')) AppError.throw('Review não encontrada.', 404);
            throw error;
        }
    }

    static async delete(userId: number, reviewId: number): Promise<void> {
        normalizeId(reviewId, 'Review');
        try {
            await runSerializableTransaction(async (tx) => {
                await ensureActiveUser(tx, userId);
                const review = await tx.review.findUnique({
                    where: { id: reviewId },
                    select: {
                        id: true,
                        userId: true,
                        gameId: true,
                        rating: true,
                        status: true,
                        deletedAt: true,
                    },
                });
                if (!review || review.deletedAt) AppError.throw('Review não encontrada.', 404);
                if (review.userId !== userId) {
                    AppError.throw('Você não pode remover a review de outro usuário.', 403);
                }

                await tx.review.update({
                    where: { id: reviewId },
                    data: { deletedAt: new Date() },
                });
                if (review.status === 'approved') {
                    await applyRatingDelta(tx, review.gameId, -review.rating, -1);
                }
            });
        } catch (error) {
            if (hasPrismaCode(error, 'P2025')) AppError.throw('Review não encontrada.', 404);
            throw error;
        }
    }

    static async report(userId: number, reviewId: number, payload: CreateReportPayload) {
        normalizeId(reviewId, 'Review');
        const reason = normalizeReason(payload.reason);
        try {
            return await runSerializableTransaction(async (tx) => {
                await ensureActiveUser(tx, userId);
                const review = await tx.review.findUnique({
                    where: { id: reviewId },
                    select: {
                        id: true,
                        userId: true,
                        rating: true,
                        text: true,
                        status: true,
                        version: true,
                        createdAt: true,
                        deletedAt: true,
                        user: {
                            select: {
                                activate: true,
                                deletedAt: true,
                                blockedUser: { select: { id: true } },
                            },
                        },
                    },
                });

                if (!review || review.deletedAt) AppError.throw('Review não encontrada.', 404);
                if (review.userId === userId) {
                    AppError.throw('Você não pode denunciar sua própria review.', 400);
                }
                if (
                    review.status !== 'approved' ||
                    !review.user.activate ||
                    review.user.deletedAt ||
                    review.user.blockedUser
                ) {
                    AppError.throw('Esta review não está disponível para denúncia.', 400);
                }

                const duplicate = await tx.report.findUnique({
                    where: {
                        reporterId_reviewId_reviewVersion: {
                            reporterId: userId,
                            reviewId,
                            reviewVersion: review.version,
                        },
                    },
                    select: { id: true },
                });
                if (duplicate) AppError.throw('Você já denunciou esta versão da review.', 409);

                const report = await tx.report.create({
                    data: {
                        reporterId: userId,
                        reviewId,
                        reason,
                        reviewRating: review.rating,
                        reviewText: review.text,
                        reviewCreatedAt: review.createdAt,
                        reviewVersion: review.version,
                        status: 'pending',
                    },
                    select: reportSelect,
                });
                await tx.notification.create({
                    data: {
                        type: 'report',
                        toUserId: review.userId,
                        fromUserId: userId,
                        entityType: 'report',
                        entityId: report.id,
                        metadata: { reviewId, reviewVersion: review.version },
                    },
                });
                return report;
            });
        } catch (error) {
            if (hasPrismaCode(error, 'P2002')) {
                AppError.throw('Você já denunciou esta review.', 409);
            }
            if (hasPrismaCode(error, 'P2003')) AppError.throw('Review não encontrada.', 404);
            throw error;
        }
    }
}
