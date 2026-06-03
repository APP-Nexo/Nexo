import { AppError } from '../../shared/errors/app-error.js';
import { comparePassword } from '../../shared/utils/argon2/compare_password.js';
import { encryptPassword } from '../../shared/utils/argon2/encrypt_password.js';
import prisma from '../../shared/utils/prisma/prisma_conn.js';
import type { UpdateMePayload } from './me.interfaces.js';
import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;

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
        const { username, bio } = payload;

        const updateData: Record<string, unknown> = {};
        const profileData: Record<string, unknown> = {};

            if (username !== undefined) updateData.username = username;
            if (bio !== undefined) profileData.bio = bio;

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

    static async updateMeMultipart(userId: number, req: any) {
        const updateData: Record<string, unknown> = {};
        const profileData: Record<string, unknown> = {};

        const parts = req.files();
        for await (const part of parts) {
            if (part.file) {
                if (!ALLOWED_TYPES.includes(part.mimetype)) {
                    throw AppError.throw('Formato inválido. Use JPEG, PNG ou WebP.', 400);
                }

                const buffer = await part.toBuffer();
                if (buffer.length > MAX_SIZE) {
                    throw AppError.throw('Arquivo muito grande. Máximo 5MB.', 400);
                }

                const ext = path.extname(part.filename) || '.jpg';
                const filename = `${userId}_${randomUUID()}${ext}`;
                const subdir = part.fieldname === 'photo' ? 'avatars' : 'banners';
                const dirpath = path.join(process.cwd(), 'public', subdir);
                await fs.mkdir(dirpath, { recursive: true });
                const filepath = path.join(dirpath, filename);
                await fs.writeFile(filepath, buffer);

                const url = `/uploads/${subdir}/${filename}`;
                profileData[part.fieldname] = url;
            } else {
                const value = await part.toBuffer().then((b: Buffer) => b.toString());
                if (part.fieldname === 'username') {
                    if (part.fieldname === 'username') {
                        const existing = await prisma.user.findUnique({ where: { username: value } });
                        if (existing && existing.id !== userId) {
                            throw AppError.throw('Username já está em uso.', 409);
                        }
                    }
                    updateData[part.fieldname] = value;
                } else if (part.fieldname === 'bio') {
                    profileData.bio = value;
                }
            }
        }

        if (Object.keys(updateData).length > 0 || Object.keys(profileData).length > 0) {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    ...updateData,
                    ...(Object.keys(profileData).length > 0
                        ? { profile: { update: profileData } }
                        : {}),
                },
            });
        }

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
