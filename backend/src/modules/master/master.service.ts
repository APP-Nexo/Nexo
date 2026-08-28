import type { Prisma } from '../../generated/client.js';
import { runSerializableTransaction } from '../../shared/infrastructure/database/transactions.js';
import { removeLocalUploadUrls } from '../../shared/infrastructure/storage/local-upload.storage.js';
import { normalizePrismaId } from '../../shared/infrastructure/validation/prisma-values.js';
import prisma from '../../shared/utils/prisma/prisma_conn.js';
import { deactivateAccount } from '../users/application/account-lifecycle.service.js';
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
    normalizePrismaId(id, 'ID de usuário', MasterErrors.throw);
}

export class MasterService {
    static async promoteUser(id: number, actorId: number): Promise<RoleActionResponse> {
        ensureTargetId(id);

        return runSerializableTransaction(prisma, async (tx) => {
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

        return runSerializableTransaction(prisma, async (tx) => {
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

        const result = await runSerializableTransaction(prisma, async (tx) => {
            await ensureMasterActor(tx, actorId);
            const user = await tx.user.findUnique({ where: { id }, select: targetUserSelect });
            if (!user) MasterErrors.throw('Usuário não existe.', 404);
            if (user.role.role === 'master') {
                MasterErrors.throw('Um usuário master não pode banir outro master.', 403);
            }
            if (!user.activate || user.deletedAt)
                MasterErrors.throw('Usuário já está banido.', 409);

            const bannedAt = new Date();
            const lifecycle = await deactivateAccount(tx, user, 'banned', bannedAt);
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
                        revokedSessions: lifecycle.revokedSessions,
                    },
                },
            });

            return {
                message: 'Usuário banido.',
                email: user.email,
                bannedAt: bannedAt.toISOString(),
                uploads: [...lifecycle.uploads],
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
