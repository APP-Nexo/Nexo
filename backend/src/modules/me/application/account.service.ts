import type { Prisma } from '../../../generated/client.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { hasPrismaCode } from '../../../shared/infrastructure/database/prisma-errors.js';
import { runSerializableTransaction } from '../../../shared/infrastructure/database/transactions.js';
import { comparePassword } from '../../../shared/utils/argon2/compare_password.js';
import prisma from '../../../shared/utils/prisma/prisma_conn.js';
import {
    type AccountLifecycleResult,
    deactivateAccount,
} from '../../users/application/account-lifecycle.service.js';
import {
    localProfileFilePath,
    removeProfileFiles,
} from '../infrastructure/profile-upload.storage.js';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../me.interfaces.js';

function ensurePassword(value: unknown, field: string): asserts value is string {
    if (
        typeof value !== 'string' ||
        value.length < PASSWORD_MIN_LENGTH ||
        value.length > PASSWORD_MAX_LENGTH
    ) {
        AppError.throw(
            `${field} deve ter entre ${PASSWORD_MIN_LENGTH} e ${PASSWORD_MAX_LENGTH} caracteres.`,
            400,
        );
    }
}

export class MeAccountService {
    static async deleteMe(userId: number, password: string) {
        ensurePassword(password, 'A senha');
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { password: true },
        });
        if (!user) AppError.throw('Usuário não encontrado.', 404);
        if (!(await comparePassword(password, user.password))) {
            AppError.throw('Senha incorreta.', 403);
        }

        const deletedAt = new Date();
        let lifecycle: AccountLifecycleResult;

        try {
            lifecycle = await runSerializableTransaction(prisma, async (tx) => {
                const lockedUser = await tx.user.update({
                    where: { id: userId },
                    data: { updatedAt: new Date() },
                    select: {
                        password: true,
                        activate: true,
                        deletedAt: true,
                        blockedUser: { select: { id: true } },
                        profile: { select: { photo: true, banner: true } },
                    },
                });
                if (!lockedUser.activate || lockedUser.deletedAt || lockedUser.blockedUser) {
                    AppError.throw('Conta inativa ou bloqueada.', 403);
                }
                if (!(await comparePassword(password, lockedUser.password))) {
                    AppError.throw('Senha incorreta.', 403);
                }
                return deactivateAccount(
                    tx,
                    { id: userId, profile: lockedUser.profile },
                    'deleted',
                    deletedAt,
                );
            });
        } catch (error) {
            if (hasPrismaCode(error, 'P2025')) {
                AppError.throw('Usuário não encontrado.', 404);
            }
            throw error;
        }

        const oldFiles = [
            localProfileFilePath(lifecycle.uploads[0]?.url, 'avatars'),
            localProfileFilePath(lifecycle.uploads[1]?.url, 'banners'),
        ].filter((filepath): filepath is string => filepath !== null);
        await removeProfileFiles(oldFiles);

        return { message: 'Conta deletada.', deletedAt: lifecycle.deactivatedAt.toISOString() };
    }
}
