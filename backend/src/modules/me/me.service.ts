import { AppError } from '../../shared/errors/app-error.js';
import { comparePassword } from '../../shared/utils/argon2/compare_password.js';
import { encryptPassword } from '../../shared/utils/argon2/encrypt_password.js';
import prisma from '../../shared/utils/prisma/prisma_conn.js';
import type { UpdateMePayload } from './me.interfaces.js';

export class MeService {
    static async getMe(userId: number) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { profile: true },
        });

        if (!user) throw AppError.throw('Usuário não encontrado.', 404);

        const { password, ...userData } = user;
        return { ...userData };
    }

    static async updateMe(userId: number, payload: UpdateMePayload) {
        const { name, username, bio, photo, banner } = payload;

        const updateData: Record<string, unknown> = {};
        const profileData: Record<string, unknown> = {};

        if (name !== undefined) updateData.name = name;
        if (username !== undefined) {
            const existing = await prisma.user.findUnique({ where: { username } });
            if (existing && existing.id !== userId) {
                throw AppError.throw('Username já está em uso.', 409);
            }
            updateData.username = username;
        }
        if (bio !== undefined) profileData.bio = bio;
        if (photo !== undefined) profileData.photo = photo;
        if (banner !== undefined) profileData.banner = banner;

        await prisma.user.update({
            where: { id: userId },
            data: {
                ...updateData,
                ...(Object.keys(profileData).length > 0
                    ? { profile: { update: profileData } }
                    : {}),
            },
        });

        return { message: 'Perfil atualizado.' };
    }

    static async changePassword(userId: number, currentPassword: string, newPassword: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw AppError.throw('Usuário não encontrado.', 404);

        const match = await comparePassword(currentPassword, user.password);
        if (!match) throw AppError.throw('Senha atual incorreta.', 403);

        await prisma.user.update({
            where: { id: userId },
            data: { password: await encryptPassword(newPassword) },
        });

        return { message: 'Senha alterada com sucesso.' };
    }

    static async deleteMe(userId: number, email: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw AppError.throw('Usuário não encontrado.', 404);
        if (user.email !== email) throw AppError.throw('Email incorreto.', 401);

        await prisma.user.update({
            where: { id: userId },
            data: {
                activate: false,
                email: `deleted_${userId}_${user.email}`,
                deletedAt: new Date(),
            },
        });

        return { message: 'Conta deletada.', deletedAt: new Date().toISOString() };
    }
}
