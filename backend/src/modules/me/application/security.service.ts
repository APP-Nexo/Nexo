import type { Prisma } from '../../../generated/client.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { hasPrismaCode } from '../../../shared/infrastructure/database/prisma-errors.js';
import { runSerializableTransaction } from '../../../shared/infrastructure/database/transactions.js';
import { comparePassword } from '../../../shared/utils/argon2/compare_password.js';
import { encryptPassword } from '../../../shared/utils/argon2/encrypt_password.js';
import prisma from '../../../shared/utils/prisma/prisma_conn.js';
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

export class MeSecurityService {
    static async changePassword(userId: number, currentPassword: string, newPassword: string) {
        ensurePassword(currentPassword, 'A senha atual');
        ensurePassword(newPassword, 'A nova senha');

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { password: true, credentialVersion: true },
        });
        if (!user) AppError.throw('Usuário não encontrado.', 404);

        if (!(await comparePassword(currentPassword, user.password))) {
            AppError.throw('Senha atual incorreta.', 403);
        }
        if (currentPassword === newPassword) {
            AppError.throw('A nova senha deve ser diferente da senha atual.', 400);
        }

        const password = await encryptPassword(newPassword);
        const revokedAt = new Date();
        try {
            await runSerializableTransaction(prisma, async (tx) => {
                const updated = await tx.user.updateMany({
                    where: {
                        id: userId,
                        password: user.password,
                        credentialVersion: user.credentialVersion,
                        activate: true,
                        deletedAt: null,
                        blockedUser: null,
                    },
                    data: { password, credentialVersion: { increment: 1 } },
                });
                if (updated.count !== 1) {
                    AppError.throw('A senha foi alterada por outra solicitação.', 409);
                }
                await tx.passwordReset.updateMany({
                    where: { userId, usedAt: null },
                    data: { usedAt: revokedAt },
                });
                await tx.authSession.updateMany({
                    where: { userId, revokedAt: null },
                    data: { revokedAt },
                });
            });
        } catch (error) {
            if (hasPrismaCode(error, 'P2025')) {
                AppError.throw('Usuário não encontrado.', 404);
            }
            throw error;
        }

        return { message: 'Senha alterada com sucesso.' };
    }
}
