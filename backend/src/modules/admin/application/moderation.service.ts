import { AppError } from '../../../shared/errors/app-error.js';
import { runSerializableTransaction } from '../../../shared/infrastructure/database/transactions.js';
import {
    normalizePrismaCursor,
    normalizePrismaId,
} from '../../../shared/infrastructure/validation/prisma-values.js';
import { cursorPaginate } from '../../../shared/utils/pagination/cursor-paginate.js';
import prisma from '../../../shared/utils/prisma/prisma_conn.js';
import { applyRatingDelta } from '../../games/application/rating-aggregate.service.js';
import type { ReportResolutionPayload, ReviewModerationPayload } from '../admin.interfaces.js';
import {
    accountUserSelect,
    DEFAULT_PAGE_SIZE,
    ensureActiveModerator,
    moderationReviewSelect,
    normalizeLimit,
    normalizeReason,
    reportSelect,
} from './admin-context.js';

export class AdminModerationService {
    static async getReviews(
        status: 'pending' | 'approved' | 'rejected' = 'pending',
        cursor?: string,
        limit = DEFAULT_PAGE_SIZE,
    ) {
        if (!['pending', 'approved', 'rejected'].includes(status)) {
            AppError.throw('Status de review inválido.', 400);
        }

        const { data, nextCursor } = await cursorPaginate({
            findMany: (args) =>
                prisma.review.findMany({
                    ...args,
                    where: { status, deletedAt: null },
                    select: moderationReviewSelect,
                    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
                }),
            take: normalizeLimit(limit),
            cursor: normalizePrismaCursor(cursor),
        });

        return { reviews: data, nextCursor };
    }

    static async moderateReview(
        reviewId: number,
        actorId: number,
        payload: ReviewModerationPayload,
    ) {
        normalizePrismaId(reviewId, 'ID da review');
        if (!payload || (payload.action !== 'approve' && payload.action !== 'reject')) {
            AppError.throw('A ação deve ser approve ou reject.', 400);
        }
        const reason = normalizeReason(payload.reason);
        if (payload.action === 'reject' && !reason) {
            AppError.throw('Informe o motivo da rejeição.', 400);
        }

        return runSerializableTransaction(prisma, async (tx) => {
            const actor = await tx.user.findUnique({
                where: { id: actorId },
                select: accountUserSelect,
            });
            if (!actor) AppError.throw('Administrador não encontrado.', 403);
            ensureActiveModerator(actor);

            const current = await tx.review.findUnique({
                where: { id: reviewId },
                select: {
                    id: true,
                    userId: true,
                    gameId: true,
                    rating: true,
                    status: true,
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
            if (!current || current.deletedAt) AppError.throw('Review não encontrada.', 404);

            const nextStatus = payload.action === 'approve' ? 'approved' : 'rejected';
            const review = await tx.review.update({
                where: { id: reviewId },
                data: { status: nextStatus, moderationReason: reason ?? null },
                select: moderationReviewSelect,
            });

            const ratingsVisible =
                current.user.activate && !current.user.deletedAt && !current.user.blockedUser;
            if (ratingsVisible && current.status === 'approved' && nextStatus !== 'approved') {
                await applyRatingDelta(tx, current.gameId, -current.rating, -1);
            } else if (
                ratingsVisible &&
                current.status !== 'approved' &&
                nextStatus === 'approved'
            ) {
                await applyRatingDelta(tx, current.gameId, current.rating, 1);
            }

            await tx.adminAuditLog.create({
                data: {
                    actorId,
                    targetUserId: current.userId,
                    action: `review.${payload.action}`,
                    entityType: 'review',
                    entityId: reviewId,
                    metadata: {
                        previousStatus: current.status,
                        newStatus: nextStatus,
                        gameId: current.gameId,
                        rating: current.rating,
                        ...(reason ? { reason } : {}),
                    },
                },
            });
            await tx.notification.create({
                data: {
                    type: 'moderation',
                    toUserId: current.userId,
                    fromUserId: actorId,
                    entityType: 'review',
                    entityId: reviewId,
                    metadata: { action: payload.action, ...(reason ? { reason } : {}) },
                },
            });

            return {
                message: nextStatus === 'approved' ? 'Review aprovada.' : 'Review rejeitada.',
                review,
            };
        });
    }

    static async deleteReview(reviewId: number, actorId: number) {
        normalizePrismaId(reviewId, 'ID da review');

        return runSerializableTransaction(prisma, async (tx) => {
            const actor = await tx.user.findUnique({
                where: { id: actorId },
                select: accountUserSelect,
            });
            if (!actor) AppError.throw('Administrador não encontrado.', 403);
            ensureActiveModerator(actor);

            const review = await tx.review.findUnique({
                where: { id: reviewId },
                select: {
                    id: true,
                    userId: true,
                    gameId: true,
                    rating: true,
                    status: true,
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

            const resolvedAt = new Date();
            const resolvedReports = await tx.report.updateMany({
                where: { reviewId, status: 'pending' },
                data: {
                    status: 'resolved',
                    resolvedById: actorId,
                    resolutionReason: 'Review removida por moderação.',
                    resolvedAt,
                },
            });
            await tx.review.update({
                where: { id: reviewId },
                data: {
                    status: 'rejected',
                    moderationReason: 'Review removida por moderação.',
                    deletedAt: resolvedAt,
                },
            });
            if (
                review.status === 'approved' &&
                review.user.activate &&
                !review.user.deletedAt &&
                !review.user.blockedUser
            ) {
                await applyRatingDelta(tx, review.gameId, -review.rating, -1);
            }
            await tx.adminAuditLog.create({
                data: {
                    actorId,
                    targetUserId: review.userId,
                    action: 'review.delete',
                    entityType: 'review',
                    entityId: reviewId,
                    metadata: {
                        gameId: review.gameId,
                        rating: review.rating,
                        status: review.status,
                        resolvedReports: resolvedReports.count,
                    },
                },
            });

            return { message: 'Review removida.' };
        });
    }

    static async getReports(
        status: 'pending' | 'resolved' | 'rejected' = 'pending',
        cursor?: string,
        limit = 50,
    ) {
        if (!['pending', 'resolved', 'rejected'].includes(status)) {
            AppError.throw('Status de denúncia inválido.', 400);
        }

        const { data, nextCursor } = await cursorPaginate({
            findMany: (args) =>
                prisma.report.findMany({
                    ...args,
                    where: { status },
                    select: reportSelect,
                    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
                }),
            take: normalizeLimit(limit),
            cursor: normalizePrismaCursor(cursor),
        });

        return { reports: data, nextCursor };
    }

    static async updateReport(reportId: number, actorId: number, payload: ReportResolutionPayload) {
        normalizePrismaId(reportId, 'ID da denúncia');
        if (!payload || (payload.status !== 'resolved' && payload.status !== 'rejected')) {
            AppError.throw('O status deve ser resolved ou rejected.', 400);
        }
        if (payload.action !== undefined && payload.action !== 'reject_review') {
            AppError.throw('Ação de denúncia inválida.', 400);
        }
        if (payload.action === 'reject_review' && payload.status !== 'resolved') {
            AppError.throw('A ação reject_review exige o status resolved.', 400);
        }
        const reason = normalizeReason(payload.reason);
        if (payload.action === 'reject_review' && !reason) {
            AppError.throw('Informe o motivo para rejeitar a review.', 400);
        }

        return runSerializableTransaction(prisma, async (tx) => {
            const actor = await tx.user.findUnique({
                where: { id: actorId },
                select: accountUserSelect,
            });
            if (!actor) AppError.throw('Administrador não encontrado.', 403);
            ensureActiveModerator(actor);

            const current = await tx.report.findUnique({
                where: { id: reportId },
                select: {
                    id: true,
                    status: true,
                    reviewId: true,
                    reviewVersion: true,
                    review: {
                        select: {
                            id: true,
                            userId: true,
                            gameId: true,
                            rating: true,
                            status: true,
                            deletedAt: true,
                            version: true,
                            user: {
                                select: {
                                    activate: true,
                                    deletedAt: true,
                                    blockedUser: { select: { id: true } },
                                },
                            },
                        },
                    },
                },
            });
            if (!current) AppError.throw('Denúncia não encontrada.', 404);
            if (current.status !== 'pending') AppError.throw('Denúncia já foi analisada.', 409);

            if (payload.action === 'reject_review') {
                if (current.review.deletedAt || current.reviewVersion !== current.review.version) {
                    AppError.throw(
                        'A review foi alterada ou removida após a denúncia. Analise a versão atual separadamente.',
                        409,
                    );
                }
                await tx.review.update({
                    where: { id: current.review.id },
                    data: { status: 'rejected', moderationReason: reason! },
                });
                if (
                    current.review.status === 'approved' &&
                    current.review.user.activate &&
                    !current.review.user.deletedAt &&
                    !current.review.user.blockedUser
                ) {
                    await applyRatingDelta(tx, current.review.gameId, -current.review.rating, -1);
                }
                await tx.adminAuditLog.create({
                    data: {
                        actorId,
                        targetUserId: current.review.userId,
                        action: 'review.reject',
                        entityType: 'review',
                        entityId: current.review.id,
                        metadata: {
                            source: 'report',
                            reportId,
                            previousStatus: current.review.status,
                            reason: reason!,
                        },
                    },
                });
            }

            const resolvedAt = new Date();
            const report = await tx.report.update({
                where: { id: reportId },
                data: {
                    status: payload.status,
                    resolvedById: actorId,
                    resolutionReason: reason ?? null,
                    resolvedAt,
                },
                select: reportSelect,
            });
            await tx.adminAuditLog.create({
                data: {
                    actorId,
                    targetUserId: current.review.userId,
                    action: `report.${payload.status === 'resolved' ? 'resolve' : 'reject'}`,
                    entityType: 'report',
                    entityId: reportId,
                    metadata: {
                        reviewId: current.reviewId,
                        previousStatus: current.status,
                        newStatus: payload.status,
                        ...(payload.action ? { action: payload.action } : {}),
                        ...(reason ? { reason } : {}),
                    },
                },
            });
            await tx.notification.create({
                data: {
                    type: 'moderation',
                    toUserId: current.review.userId,
                    fromUserId: actorId,
                    entityType: 'report',
                    entityId: reportId,
                    metadata: {
                        status: payload.status,
                        ...(payload.action ? { action: payload.action } : {}),
                    },
                },
            });

            return {
                message:
                    payload.status === 'resolved' ? 'Denúncia resolvida.' : 'Denúncia rejeitada.',
                report,
            };
        });
    }
}
