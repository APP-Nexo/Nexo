import type { Prisma } from '../../../generated/client.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { hasPrismaCode } from '../../../shared/infrastructure/database/prisma-errors.js';
import { runSerializableTransaction } from '../../../shared/infrastructure/database/transactions.js';
import { removeLocalUploadUrls } from '../../../shared/infrastructure/storage/local-upload.storage.js';
import {
    normalizePrismaCursor,
    normalizePrismaId,
} from '../../../shared/infrastructure/validation/prisma-values.js';
import { cursorPaginate } from '../../../shared/utils/pagination/cursor-paginate.js';
import prisma from '../../../shared/utils/prisma/prisma_conn.js';
import { recalculateRatingsForUser } from '../../games/application/rating-aggregate.service.js';
import { detachUserSocialGraph } from '../../social/application/social-graph.service.js';
import { deactivateAccount } from '../../users/application/account-lifecycle.service.js';
import {
    accountUserSelect,
    adminUserSelect,
    DEFAULT_PAGE_SIZE,
    ensureCanAdminister,
    normalizeLimit,
    normalizeReason,
} from './admin-context.js';

export class AdminUserManagementService {
    static async getUsersAdmin(cursor?: string, limit = DEFAULT_PAGE_SIZE) {
        return AdminUserManagementService.listUsers(
            { role: { is: { role: 'admin' } } },
            cursor,
            limit,
        );
    }

    static async searchUser(query: string, cursor?: string) {
        if (typeof query !== 'string' || !query.trim()) {
            AppError.throw('Informe um email ou username para a busca.', 400);
        }
        const normalized = query.trim();
        if (normalized.length > 255)
            AppError.throw('A busca deve ter no máximo 255 caracteres.', 400);

        return AdminUserManagementService.listUsers(
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
        return AdminUserManagementService.listUsers({}, cursor, limit);
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
            cursor: normalizePrismaCursor(cursor),
        });

        return { users: data, nextCursor };
    }

    static async getUserDetail(id: number) {
        normalizePrismaId(id, 'ID de usuário');
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
        normalizePrismaId(userId, 'ID de usuário');
        const reason = normalizeReason(rawReason);

        try {
            return await runSerializableTransaction(prisma, async (tx) => {
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
                await recalculateRatingsForUser(tx, userId);
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
        normalizePrismaId(userId, 'ID de usuário');

        return runSerializableTransaction(prisma, async (tx) => {
            const [actor, target] = await Promise.all([
                tx.user.findUnique({ where: { id: actorId }, select: accountUserSelect }),
                tx.user.findUnique({ where: { id: userId }, select: accountUserSelect }),
            ]);
            if (!actor) AppError.throw('Administrador não encontrado.', 403);
            if (!target) AppError.throw('Usuário não encontrado.', 404);
            ensureCanAdminister(actor, target);
            if (!target.blockedUser) AppError.throw('Usuário não está bloqueado.', 404);

            await tx.blockedUser.delete({ where: { userId } });
            await recalculateRatingsForUser(tx, userId);
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
        normalizePrismaId(userId, 'ID de usuário');

        const result = await runSerializableTransaction(prisma, async (tx) => {
            const [actor, target] = await Promise.all([
                tx.user.findUnique({ where: { id: actorId }, select: accountUserSelect }),
                tx.user.findUnique({ where: { id: userId }, select: accountUserSelect }),
            ]);
            if (!actor) AppError.throw('Administrador não encontrado.', 403);
            if (!target) AppError.throw('Usuário não encontrado.', 404);
            ensureCanAdminister(actor, target);
            if (!target.activate || target.deletedAt)
                AppError.throw('Usuário já está deletado.', 409);

            const lifecycle = await deactivateAccount(tx, target, 'deleted');
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
                        revokedSessions: lifecycle.revokedSessions,
                    },
                },
            });

            return {
                message: 'Usuário deletado.',
                uploads: lifecycle.uploads,
            };
        });
        await removeLocalUploadUrls(result.uploads);
        return { message: result.message };
    }
}
