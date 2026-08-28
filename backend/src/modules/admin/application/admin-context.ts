import type { Prisma } from '../../../generated/client.js';
import { AppError } from '../../../shared/errors/app-error.js';

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

export const profileSelect = {
    id: true,
    friendlyId: true,
    photo: true,
    banner: true,
    config: true,
    bio: true,
    followersCount: true,
    followingCount: true,
} satisfies Prisma.UserProfileSelect;

export const adminUserSelect = {
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

export const accountUserSelect = {
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

export const moderationReviewSelect = {
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

export const reportSelect = {
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

export type AccountUser = Prisma.UserGetPayload<{ select: typeof accountUserSelect }>;

export function normalizeLimit(limit: number): number {
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) {
        AppError.throw(`O limite deve ser um inteiro entre 1 e ${MAX_PAGE_SIZE}.`, 400);
    }
    return limit;
}

export function normalizeReason(reason?: string): string | undefined {
    if (reason === undefined) return undefined;
    if (typeof reason !== 'string') AppError.throw('O motivo deve ser uma string.', 400);

    const normalized = reason.trim();
    if (!normalized || normalized.length > 500) {
        AppError.throw('O motivo deve ter entre 1 e 500 caracteres.', 400);
    }
    return normalized;
}

export function ensureCanAdminister(actor: AccountUser, target: AccountUser) {
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

export function ensureActiveModerator(actor: AccountUser) {
    if (
        (actor.role.role !== 'admin' && actor.role.role !== 'master') ||
        !actor.activate ||
        actor.deletedAt ||
        actor.blockedUser
    ) {
        AppError.throw('Você não tem permissão para moderar.', 403);
    }
}
