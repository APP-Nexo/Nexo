import { randomUUID } from 'node:crypto';
import type { Prisma } from '../../generated/client.js';
import { AppError } from '../../shared/errors/app-error.js';
import { cursorPaginate } from '../../shared/utils/pagination/cursor-paginate.js';
import prisma from '../../shared/utils/prisma/prisma_conn.js';
import { removeLocalUploadUrls } from '../../shared/utils/uploads/local_uploads.js';
import {
    detachUserSocialGraph,
    recalculateUserReviewGames,
} from '../../shared/utils/users/account_state.js';
import type { ReportResolutionPayload, ReviewModerationPayload } from './admin.interfaces.js';

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;
const PRISMA_INT_MAX = 2_147_483_647;

const profileSelect = {
    id: true,
    friendlyId: true,
    photo: true,
    banner: true,
    config: true,
    bio: true,
    followersCount: true,
    followingCount: true,
} satisfies Prisma.UserProfileSelect;

const adminUserSelect = {
    id: true,
    username: true,
    email: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    activate: true,
    role: { select: { id: true, role: true } },
    profile: { select: profileSelect },
    blockedUser: {
        select: { id: true, blockedById: true, reason: true, createdAt: true },
    },
} satisfies Prisma.UserSelect;

const accountUserSelect = {
    id: true,
    email: true,
    activate: true,
    deletedAt: true,
    role: { select: { role: true } },
    profile: { select: { photo: true, banner: true } },
    blockedUser: {
        select: { id: true, blockedById: true, reason: true, createdAt: true },
    },
} satisfies Prisma.UserSelect;

const moderationReviewSelect = {
    id: true,
    userId: true,
    gameId: true,
    rating: true,
    text: true,
    status: true,
    moderationReason: true,
    createdAt: true,
    updatedAt: true,
    user: {
        select: {
            id: true,
            username: true,
            email: true,
            profile: { select: { photo: true } },
        },
    },
    game: { select: { id: true, title: true, cover: true } },
    _count: { select: { reports: true } },
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
    resolvedById: true,
    resolutionReason: true,
    resolvedAt: true,
    createdAt: true,
    updatedAt: true,
    reporter: {
        select: {
            id: true,
            username: true,
            email: true,
            profile: { select: { photo: true } },
        },
    },
    review: {
        select: {
            id: true,
            userId: true,
            gameId: true,
            rating: true,
            text: true,
            status: true,
            moderationReason: true,
            user: { select: { id: true, username: true } },
            game: { select: { id: true, title: true, cover: true } },
        },
    },
    resolvedBy: { select: { id: true, username: true, email: true } },
} satisfies Prisma.ReportSelect;

type AccountUser = Prisma.UserGetPayload<{ select: typeof accountUserSelect }>;

function hasPrismaCode(error: unknown, code: string): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === code;
}

async function runAdminTransaction<T>(
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

function normalizeId(id: number, entity: string): number {
    if (!Number.isSafeInteger(id) || id < 1 || id > PRISMA_INT_MAX) {
        AppError.throw(`${entity} inválido.`, 400);
    }
    return id;
}

function normalizeCursor(cursor?: string): string | undefined {
    if (cursor === undefined) return undefined;

    const value = Number(cursor);
    if (!Number.isSafeInteger(value) || value < 1 || value > PRISMA_INT_MAX) {
        AppError.throw('Cursor inválido.', 400);
    }
    return String(value);
}

function normalizeLimit(limit: number): number {
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) {
        AppError.throw(`O limite deve ser um inteiro entre 1 e ${MAX_PAGE_SIZE}.`, 400);
    }
    return limit;
}

function normalizeReason(reason?: string): string | undefined {
    if (reason === undefined) return undefined;
    if (typeof reason !== 'string') AppError.throw('O motivo deve ser uma string.', 400);

    const normalized = reason.trim();
    if (!normalized || normalized.length > 500) {
        AppError.throw('O motivo deve ter entre 1 e 500 caracteres.', 400);
    }
    return normalized;
}

function ensureCanAdminister(actor: AccountUser, target: AccountUser) {
    if (!actor.activate || actor.deletedAt || actor.blockedUser) {
        AppError.throw('A conta do administrador não está disponível.', 403);
    }
    if (actor.role.role !== 'admin' && actor.role.role !== 'master') {
        AppError.throw('Você não tem permissão para administrar usuários.', 403);
    }
    if (actor.id === target.id) AppError.throw('Você não pode administrar a própria conta.', 403);
    if (target.role.role === 'master') {
        AppError.throw('Contas master não podem ser administradas por esta rota.', 403);
    }
    if (actor.role.role === 'admin' && target.role.role === 'admin') {
        AppError.throw('Um admin não pode administrar outro admin.', 403);
    }
}

function ensureActiveModerator(actor: AccountUser) {
    if (
        (actor.role.role !== 'admin' && actor.role.role !== 'master') ||
        !actor.activate ||
        actor.deletedAt ||
        actor.blockedUser
    ) {
        AppError.throw('Você não tem permissão para moderar.', 403);
    }
}

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

    static async getUsersAdmin(cursor?: string, limit = DEFAULT_PAGE_SIZE) {
        return AdminService.listUsers({ role: { is: { role: 'admin' } } }, cursor, limit);
    }

    static async searchUser(query: string, cursor?: string) {
        if (typeof query !== 'string' || !query.trim()) {
            AppError.throw('Informe um email ou username para a busca.', 400);
        }
        const normalized = query.trim();
        if (normalized.length > 255)
            AppError.throw('A busca deve ter no máximo 255 caracteres.', 400);

        return AdminService.listUsers(
            {
                OR: [
                    { email: { contains: normalized, mode: 'insensitive' } },
                    { username: { contains: normalized, mode: 'insensitive' } },
                ],
            },
            cursor,
            DEFAULT_PAGE_SIZE,
        );
    }

    static async getUsers(cursor?: string, limit = DEFAULT_PAGE_SIZE) {
        return AdminService.listUsers({}, cursor, limit);
    }

    private static async listUsers(where: Prisma.UserWhereInput, cursor?: string, limit = 10) {
        const take = normalizeLimit(limit);
        const { data, nextCursor } = await cursorPaginate({
            findMany: (args) =>
                prisma.user.findMany({
                    ...args,
                    where,
                    select: adminUserSelect,
                    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
                }),
            take,
            cursor: normalizeCursor(cursor),
        });

        return { users: data, nextCursor };
    }

    static async getUserDetail(id: number) {
        normalizeId(id, 'ID de usuário');
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                ...adminUserSelect,
                reviews: {
                    where: { deletedAt: null },
                    take: 5,
                    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
                    select: {
                        id: true,
                        gameId: true,
                        rating: true,
                        text: true,
                        status: true,
                        moderationReason: true,
                        createdAt: true,
                        updatedAt: true,
                        game: { select: { id: true, title: true, cover: true } },
                    },
                },
            },
        });
        if (!user) AppError.throw('Usuário não encontrado.', 404);

        return { ...user, isBlocked: Boolean(user.blockedUser) };
    }

    static async blockUser(userId: number, actorId: number, rawReason?: string) {
        normalizeId(userId, 'ID de usuário');
        const reason = normalizeReason(rawReason);

        try {
            return await runAdminTransaction(async (tx) => {
                const [actor, target] = await Promise.all([
                    tx.user.findUnique({ where: { id: actorId }, select: accountUserSelect }),
                    tx.user.findUnique({ where: { id: userId }, select: accountUserSelect }),
                ]);
                if (!actor) AppError.throw('Administrador não encontrado.', 403);
                if (!target) AppError.throw('Usuário não encontrado.', 404);
                ensureCanAdminister(actor, target);
                if (target.blockedUser) AppError.throw('Usuário já está bloqueado.', 409);
                if (!target.activate || target.deletedAt) {
                    AppError.throw('Usuários desativados não podem ser bloqueados.', 409);
                }

                await tx.blockedUser.create({
                    data: { userId, blockedById: actorId, reason: reason ?? null },
                });
                await tx.user.update({
                    where: { id: userId },
                    data: { credentialVersion: { increment: 1 } },
                });
                await recalculateUserReviewGames(tx, userId);
                await detachUserSocialGraph(tx, userId);
                const revokedAt = new Date();
                const revokedSessions = await tx.authSession.updateMany({
                    where: { userId, revokedAt: null },
                    data: { revokedAt },
                });
                await tx.adminAuditLog.create({
                    data: {
                        actorId,
                        targetUserId: userId,
                        action: 'user.block',
                        entityType: 'user',
                        entityId: userId,
                        metadata: {
                            ...(reason ? { reason } : {}),
                            revokedSessions: revokedSessions.count,
                        },
                    },
                });

                return { message: 'Usuário bloqueado.' };
            });
        } catch (error) {
            if (hasPrismaCode(error, 'P2002')) AppError.throw('Usuário já está bloqueado.', 409);
            throw error;
        }
    }

    static async unblockUser(userId: number, actorId: number) {
        normalizeId(userId, 'ID de usuário');

        return runAdminTransaction(async (tx) => {
            const [actor, target] = await Promise.all([
                tx.user.findUnique({ where: { id: actorId }, select: accountUserSelect }),
                tx.user.findUnique({ where: { id: userId }, select: accountUserSelect }),
            ]);
            if (!actor) AppError.throw('Administrador não encontrado.', 403);
            if (!target) AppError.throw('Usuário não encontrado.', 404);
            ensureCanAdminister(actor, target);
            if (!target.blockedUser) AppError.throw('Usuário não está bloqueado.', 404);

            await tx.blockedUser.delete({ where: { userId } });
            await recalculateUserReviewGames(tx, userId);
            await tx.adminAuditLog.create({
                data: {
                    actorId,
                    targetUserId: userId,
                    action: 'user.unblock',
                    entityType: 'user',
                    entityId: userId,
                    metadata: {
                        blockedById: target.blockedUser.blockedById,
                        hadReason: Boolean(target.blockedUser.reason),
                    },
                },
            });

            return { message: 'Usuário desbloqueado.' };
        });
    }

    static async deleteUser(userId: number, actorId: number) {
        normalizeId(userId, 'ID de usuário');

        const result = await runAdminTransaction(async (tx) => {
            const [actor, target] = await Promise.all([
                tx.user.findUnique({ where: { id: actorId }, select: accountUserSelect }),
                tx.user.findUnique({ where: { id: userId }, select: accountUserSelect }),
            ]);
            if (!actor) AppError.throw('Administrador não encontrado.', 403);
            if (!target) AppError.throw('Usuário não encontrado.', 404);
            ensureCanAdminister(actor, target);
            if (!target.activate || target.deletedAt)
                AppError.throw('Usuário já está deletado.', 409);

            const deletedAt = new Date();
            const anonymousId = randomUUID();
            await tx.user.update({
                where: { id: userId },
                data: {
                    activate: false,
                    deletedAt,
                    credentialVersion: { increment: 1 },
                    username: `deleted_${userId}_${anonymousId}`,
                    email: `deleted-${userId}-${anonymousId}@deleted.invalid`,
                },
            });
            await tx.userProfile.updateMany({
                where: { userId },
                data: { photo: null, banner: null, bio: null },
            });
            await recalculateUserReviewGames(tx, userId);
            await detachUserSocialGraph(tx, userId);
            const revokedSessions = await tx.authSession.updateMany({
                where: { userId, revokedAt: null },
                data: { revokedAt: deletedAt },
            });
            await tx.adminAuditLog.create({
                data: {
                    actorId,
                    targetUserId: userId,
                    action: 'user.delete',
                    entityType: 'user',
                    entityId: userId,
                    metadata: {
                        previousEmail: target.email,
                        previousRole: target.role.role,
                        revokedSessions: revokedSessions.count,
                    },
                },
            });

            return {
                message: 'Usuário deletado.',
                uploads: [
                    { directory: 'avatars' as const, url: target.profile?.photo },
                    { directory: 'banners' as const, url: target.profile?.banner },
                ],
            };
        });
        await removeLocalUploadUrls(result.uploads);
        return { message: result.message };
    }

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
            cursor: normalizeCursor(cursor),
        });

        return { reviews: data, nextCursor };
    }

    static async moderateReview(
        reviewId: number,
        actorId: number,
        payload: ReviewModerationPayload,
    ) {
        normalizeId(reviewId, 'ID da review');
        if (!payload || (payload.action !== 'approve' && payload.action !== 'reject')) {
            AppError.throw('A ação deve ser approve ou reject.', 400);
        }
        const reason = normalizeReason(payload.reason);
        if (payload.action === 'reject' && !reason) {
            AppError.throw('Informe o motivo da rejeição.', 400);
        }

        return runAdminTransaction(async (tx) => {
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
        normalizeId(reviewId, 'ID da review');

        return runAdminTransaction(async (tx) => {
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
            cursor: normalizeCursor(cursor),
        });

        return { reports: data, nextCursor };
    }

    static async updateReport(reportId: number, actorId: number, payload: ReportResolutionPayload) {
        normalizeId(reportId, 'ID da denúncia');
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

        return runAdminTransaction(async (tx) => {
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
