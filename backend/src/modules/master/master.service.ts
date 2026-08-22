import { randomUUID } from 'node:crypto';
import type { Prisma } from '../../generated/client.js';
import prisma from '../../shared/utils/prisma/prisma_conn.js';
import { removeLocalUploadUrls } from '../../shared/utils/uploads/local_uploads.js';
import {
    detachUserSocialGraph,
    recalculateUserReviewGames,
} from '../../shared/utils/users/account_state.js';
import { MasterErrors } from './master.errors.js';
import type { BanResponse, RoleActionResponse } from './master.interfaces.js';

const targetUserSelect = {
    id: true,
    email: true,
    activate: true,
    deletedAt: true,
    blockedUser: { select: { id: true } },
    profile: { select: { photo: true, banner: true } },
    role: { select: { role: true } },
} satisfies Prisma.UserSelect;

const PRISMA_INT_MAX = 2_147_483_647;

function hasPrismaCode(error: unknown, code: string): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === code;
}

async function runMasterTransaction<T>(
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

async function ensureMasterActor(tx: Prisma.TransactionClient, actorId: number) {
    const actor = await tx.user.findUnique({ where: { id: actorId }, select: targetUserSelect });
    if (
        !actor ||
        actor.role.role !== 'master' ||
        !actor.activate ||
        actor.deletedAt ||
        actor.blockedUser
    ) {
        MasterErrors.throw('Você não tem permissão para esta ação.', 403);
    }
    return actor;
}

function ensureTargetId(id: number) {
    if (!Number.isSafeInteger(id) || id < 1 || id > PRISMA_INT_MAX) {
        MasterErrors.throw('ID de usuário inválido.', 400);
    }
}

export class MasterService {
    static async promoteUser(id: number, actorId: number): Promise<RoleActionResponse> {
        ensureTargetId(id);

        return runMasterTransaction(async (tx) => {
            await ensureMasterActor(tx, actorId);
            const user = await tx.user.findUnique({ where: { id }, select: targetUserSelect });
            if (!user) MasterErrors.throw('Usuário não existe.', 404);
            if (user.role.role === 'master') {
                MasterErrors.throw('Um usuário master não pode ser promovido para admin.', 403);
            }
            if (user.role.role === 'admin') {
                MasterErrors.throw('Usuário já é admin.', 409);
            }

            const adminRole = await tx.role.findUnique({
                where: { role: 'admin' },
                select: { id: true },
            });
            if (!adminRole) MasterErrors.throw('Role admin não configurada.', 500);

            await tx.user.update({ where: { id }, data: { roleId: adminRole.id } });
            await tx.adminAuditLog.create({
                data: {
                    actorId,
                    targetUserId: id,
                    action: 'user.promote',
                    entityType: 'user',
                    entityId: id,
                    metadata: { previousRole: user.role.role, newRole: 'admin' },
                },
            });

            return {
                message: 'Usuário promovido para admin.',
                email: user.email,
                role: 'admin',
            };
        });
    }

    static async demoteUser(id: number, actorId: number): Promise<RoleActionResponse> {
        ensureTargetId(id);
        if (id === actorId) MasterErrors.throw('Você não pode rebaixar a própria conta.', 403);

        return runMasterTransaction(async (tx) => {
            await ensureMasterActor(tx, actorId);
            const user = await tx.user.findUnique({ where: { id }, select: targetUserSelect });
            if (!user) MasterErrors.throw('Usuário não existe.', 404);
            if (user.role.role === 'user')
                MasterErrors.throw('Usuário já possui a role user.', 409);

            const userRole = await tx.role.findUnique({
                where: { role: 'user' },
                select: { id: true },
            });
            if (!userRole) MasterErrors.throw('Role user não configurada.', 500);

            const revokedAt = new Date();
            await tx.user.update({ where: { id }, data: { roleId: userRole.id } });
            const revokedSessions = await tx.authSession.updateMany({
                where: { userId: id, revokedAt: null },
                data: { revokedAt },
            });
            await tx.adminAuditLog.create({
                data: {
                    actorId,
                    targetUserId: id,
                    action: 'user.demote',
                    entityType: 'user',
                    entityId: id,
                    metadata: {
                        previousRole: user.role.role,
                        newRole: 'user',
                        revokedSessions: revokedSessions.count,
                    },
                },
            });

            return {
                message: 'Usuário rebaixado para user.',
                email: user.email,
                role: 'user',
            };
        });
    }

    static async banUser(id: number, actorId: number): Promise<BanResponse> {
        ensureTargetId(id);
        if (id === actorId) MasterErrors.throw('Você não pode banir a própria conta.', 403);

        const result = await runMasterTransaction(async (tx) => {
            await ensureMasterActor(tx, actorId);
            const user = await tx.user.findUnique({ where: { id }, select: targetUserSelect });
            if (!user) MasterErrors.throw('Usuário não existe.', 404);
            if (user.role.role === 'master') {
                MasterErrors.throw('Um usuário master não pode banir outro master.', 403);
            }
            if (!user.activate || user.deletedAt)
                MasterErrors.throw('Usuário já está banido.', 409);

            const bannedAt = new Date();
            const anonymousId = randomUUID();
            await tx.user.update({
                where: { id },
                data: {
                    activate: false,
                    username: `banned_${id}_${anonymousId}`,
                    email: `banned-${id}-${anonymousId}@deleted.invalid`,
                    deletedAt: bannedAt,
                    credentialVersion: { increment: 1 },
                },
            });
            await tx.userProfile.updateMany({
                where: { userId: id },
                data: { photo: null, banner: null, bio: null },
            });
            await recalculateUserReviewGames(tx, id);
            await detachUserSocialGraph(tx, id);
            const revokedSessions = await tx.authSession.updateMany({
                where: { userId: id, revokedAt: null },
                data: { revokedAt: bannedAt },
            });
            await tx.adminAuditLog.create({
                data: {
                    actorId,
                    targetUserId: id,
                    action: 'user.ban',
                    entityType: 'user',
                    entityId: id,
                    metadata: {
                        previousRole: user.role.role,
                        previousEmail: user.email,
                        revokedSessions: revokedSessions.count,
                    },
                },
            });

            return {
                message: 'Usuário banido.',
                email: user.email,
                bannedAt: bannedAt.toISOString(),
                uploads: [
                    { directory: 'avatars' as const, url: user.profile?.photo },
                    { directory: 'banners' as const, url: user.profile?.banner },
                ],
            };
        });
        await removeLocalUploadUrls(result.uploads);
        return {
            message: result.message,
            email: result.email,
            bannedAt: result.bannedAt,
        };
    }
}
