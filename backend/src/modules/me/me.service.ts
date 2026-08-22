import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { FastifyRequest } from 'fastify';
import type { Prisma } from '../../generated/client.js';
import { AppError } from '../../shared/errors/app-error.js';
import { comparePassword } from '../../shared/utils/argon2/compare_password.js';
import { encryptPassword } from '../../shared/utils/argon2/encrypt_password.js';
import {
    USERNAME_MAX_LENGTH as AUTH_USERNAME_MAX_LENGTH,
    USERNAME_MIN_LENGTH as AUTH_USERNAME_MIN_LENGTH,
    isValidUsername,
    normalizeUsername,
} from '../../shared/utils/auth/auth_values.js';
import prisma from '../../shared/utils/prisma/prisma_conn.js';
import {
    detachUserSocialGraph,
    recalculateUserReviewGames,
} from '../../shared/utils/users/account_state.js';
import {
    BIO_MAX_LENGTH,
    PASSWORD_MAX_LENGTH,
    PASSWORD_MIN_LENGTH,
    type UpdateMePayload,
    USERNAME_MAX_LENGTH,
    USERNAME_MIN_LENGTH,
} from './me.interfaces.js';

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;
const MULTIPART_FIELDS = new Set(['photo', 'banner', 'username', 'bio']);
const FILE_FIELDS = new Set(['photo', 'banner']);
const TEXT_FIELDS = new Set(['username', 'bio']);
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const WEBP_RIFF_SIGNATURE = Buffer.from('RIFF');
const WEBP_SIGNATURE = Buffer.from('WEBP');

const PROFILE_SELECT = {
    friendlyId: true,
    photo: true,
    banner: true,
    bio: true,
    config: true,
    followersCount: true,
    followingCount: true,
} satisfies Prisma.UserProfileSelect;

const ME_SELECT = {
    id: true,
    username: true,
    email: true,
    roleId: true,
    createdAt: true,
    activate: true,
    deletedAt: true,
    blockedUser: { select: { id: true } },
    profile: { select: PROFILE_SELECT },
} satisfies Prisma.UserSelect;

type MeRecord = Prisma.UserGetPayload<{ select: typeof ME_SELECT }>;
type ImageField = 'photo' | 'banner';
type ImageType = {
    extension: '.jpg' | '.png' | '.webp';
    mime: 'image/jpeg' | 'image/png' | 'image/webp';
};
type StagedUpload = {
    field: ImageField;
    directory: 'avatars' | 'banners';
    temporaryPath: string;
    finalPath: string;
    url: string;
};

function hasPrismaCode(error: unknown, code: string): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === code;
}

async function runMeTransaction<T>(
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

function mapUpdateError(error: unknown): never {
    if (hasPrismaCode(error, 'P2002')) {
        AppError.throw('Username já está em uso.', 409);
    }
    if (hasPrismaCode(error, 'P2025')) {
        AppError.throw('Usuário não encontrado.', 404);
    }
    throw error;
}

function toMeResponse(user: MeRecord) {
    return {
        id: user.id,
        username: user.username,
        email: user.email,
        roleId: user.roleId,
        createdAt: user.createdAt,
        profile: user.profile,
    };
}

function ensureAvailable(user: MeRecord) {
    if (!user.activate || user.deletedAt || user.blockedUser) {
        AppError.throw('Conta inativa ou bloqueada.', 403);
    }
}

function normalizeUpdatePayload(payload: UpdateMePayload, allowEmpty = false): UpdateMePayload {
    if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
        AppError.throw('Dados de perfil inválidos.', 400);
    }

    const input = payload as Record<string, unknown>;
    const keys = Object.keys(input);
    if (keys.some((key) => !TEXT_FIELDS.has(key))) {
        AppError.throw('Campo de perfil inválido.', 400);
    }
    if (!allowEmpty && keys.length === 0) {
        AppError.throw('Informe ao menos um campo para atualizar.', 400);
    }

    const normalized: UpdateMePayload = {};
    if (Object.hasOwn(input, 'username')) {
        if (typeof input.username !== 'string') {
            AppError.throw('Username inválido.', 400);
        }

        const username = normalizeUsername(input.username);
        if (!isValidUsername(username)) {
            AppError.throw(
                `O username deve ter entre ${USERNAME_MIN_LENGTH} e ${USERNAME_MAX_LENGTH} caracteres e usar apenas letras, números, ponto, hífen ou underscore.`,
                400,
            );
        }
        normalized.username = username;
    }

    if (Object.hasOwn(input, 'bio')) {
        if (typeof input.bio !== 'string' || input.bio.length > BIO_MAX_LENGTH) {
            AppError.throw(`A bio deve ter no máximo ${BIO_MAX_LENGTH} caracteres.`, 400);
        }
        normalized.bio = input.bio;
    }

    if (!allowEmpty && normalized.username === undefined && normalized.bio === undefined) {
        AppError.throw('Informe ao menos um campo para atualizar.', 400);
    }
    return normalized;
}

async function ensureUsernameAvailable(userId: number, username: string | undefined) {
    if (username === undefined) return;

    const existing = await prisma.user.findFirst({
        where: {
            id: { not: userId },
            username: { equals: username, mode: 'insensitive' },
        },
        select: { id: true },
    });
    if (existing) {
        AppError.throw('Username já está em uso.', 409);
    }
}

function buildUpdateData(
    payload: UpdateMePayload,
    uploads: readonly StagedUpload[] = [],
): Prisma.UserUpdateInput {
    const profileData: { bio?: string; photo?: string; banner?: string } = {};
    if (payload.bio !== undefined) profileData.bio = payload.bio;
    for (const upload of uploads) profileData[upload.field] = upload.url;

    return {
        ...(payload.username !== undefined ? { username: payload.username } : {}),
        ...(Object.keys(profileData).length > 0
            ? {
                  profile: {
                      upsert: {
                          create: { ...profileData },
                          update: { ...profileData },
                      },
                  },
              }
            : {}),
    };
}

function detectImageType(buffer: Buffer): ImageType | null {
    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        return { extension: '.jpg', mime: 'image/jpeg' };
    }
    if (buffer.length >= PNG_SIGNATURE.length && buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
        return { extension: '.png', mime: 'image/png' };
    }
    if (
        buffer.length >= 12 &&
        buffer.subarray(0, 4).equals(WEBP_RIFF_SIGNATURE) &&
        buffer.subarray(8, 12).equals(WEBP_SIGNATURE)
    ) {
        return { extension: '.webp', mime: 'image/webp' };
    }
    return null;
}

function invalidMultipartField(): never {
    AppError.throw('Use apenas os campos photo, banner, username e bio.', 400);
}

function throwMultipartError(error: unknown): never {
    if (error instanceof AppError) throw error;
    if (
        typeof error === 'object' &&
        error !== null &&
        'statusCode' in error &&
        error.statusCode === 413
    ) {
        throw error;
    }
    AppError.throw('Conteúdo multipart inválido.', 400);
}

async function* multipartParts(req: FastifyRequest) {
    try {
        yield* req.parts({
            limits: {
                fileSize: MAX_UPLOAD_SIZE,
                files: 2,
                fields: 2,
                parts: 4,
                fieldSize: BIO_MAX_LENGTH * 4,
            },
        });
    } catch (error) {
        throwMultipartError(error);
    }
}

async function parseMultipart(req: FastifyRequest, userId: number) {
    const textPayload: UpdateMePayload = {};
    const uploads: StagedUpload[] = [];
    const temporaryPaths: string[] = [];
    const seenFields = new Set<string>();

    try {
        for await (const part of multipartParts(req)) {
            if (!MULTIPART_FIELDS.has(part.fieldname) || seenFields.has(part.fieldname)) {
                if (part.type === 'file') part.file.resume();
                invalidMultipartField();
            }
            seenFields.add(part.fieldname);

            if (part.type === 'file') {
                if (!FILE_FIELDS.has(part.fieldname)) {
                    part.file.resume();
                    invalidMultipartField();
                }

                const field = part.fieldname as ImageField;
                const directory = field === 'photo' ? 'avatars' : 'banners';
                const uploadId = randomUUID();
                const temporary = safeUploadPath(directory, `.${userId}_${uploadId}.tmp`);
                temporaryPaths.push(temporary.filepath);
                await fs.mkdir(temporary.baseDirectory, { recursive: true });

                const file = await fs.open(temporary.filepath, 'wx', 0o600);
                let size = 0;
                let signature = Buffer.alloc(0);
                try {
                    for await (const value of part.file) {
                        const chunk = Buffer.isBuffer(value) ? value : Buffer.from(value);
                        size += chunk.length;
                        if (size > MAX_UPLOAD_SIZE) {
                            AppError.throw('Arquivo muito grande ou vazio.', 400);
                        }
                        if (signature.length < 12) {
                            signature = Buffer.concat([
                                signature,
                                chunk.subarray(0, 12 - signature.length),
                            ]);
                        }

                        let offset = 0;
                        while (offset < chunk.length) {
                            const { bytesWritten } = await file.write(
                                chunk,
                                offset,
                                chunk.length - offset,
                                null,
                            );
                            if (bytesWritten === 0)
                                throw new Error('Não foi possível gravar o upload.');
                            offset += bytesWritten;
                        }
                    }
                } finally {
                    await file.close();
                }

                if (part.file.truncated || size === 0) {
                    AppError.throw('Arquivo muito grande ou vazio.', 400);
                }

                const imageType = detectImageType(signature);
                if (!imageType) {
                    AppError.throw('Arquivo inválido. Use uma imagem JPEG, PNG ou WebP.', 400);
                }
                if (part.mimetype.toLowerCase() !== imageType.mime) {
                    AppError.throw('O MIME informado não corresponde ao conteúdo da imagem.', 400);
                }

                const filename = `${userId}_${uploadId}${imageType.extension}`;
                uploads.push({
                    field,
                    directory,
                    temporaryPath: temporary.filepath,
                    finalPath: safeUploadPath(directory, filename).filepath,
                    url: `/uploads/${directory}/${filename}`,
                });
                continue;
            }

            if (
                !TEXT_FIELDS.has(part.fieldname) ||
                part.fieldnameTruncated ||
                part.valueTruncated ||
                typeof part.value !== 'string'
            ) {
                invalidMultipartField();
            }
            if (part.fieldname === 'username') textPayload.username = part.value;
            if (part.fieldname === 'bio') textPayload.bio = part.value;
        }

        if (seenFields.size === 0) {
            AppError.throw('Informe ao menos um campo para atualizar.', 400);
        }

        return { payload: normalizeUpdatePayload(textPayload, true), uploads };
    } catch (error) {
        await removePaths([...temporaryPaths, ...uploads.map((upload) => upload.finalPath)]);
        throw error;
    }
}

function safeUploadPath(directory: 'avatars' | 'banners', filename: string) {
    const baseDirectory = path.resolve(process.cwd(), 'public', directory);
    const filepath = path.resolve(baseDirectory, filename);
    if (path.dirname(filepath) !== baseDirectory) {
        AppError.throw('Caminho de upload inválido.', 400);
    }
    return { baseDirectory, filepath };
}

async function removePaths(paths: readonly string[]) {
    await Promise.allSettled(paths.map((filepath) => fs.unlink(filepath)));
}

function oldLocalUploadPath(url: string | null | undefined, directory: 'avatars' | 'banners') {
    if (!url) return null;

    const prefix = `/uploads/${directory}/`;
    if (!url.startsWith(prefix)) return null;
    const filename = url.slice(prefix.length);
    if (!filename || filename !== path.basename(filename)) return null;

    const local = safeUploadPath(directory, filename);
    return local.filepath;
}

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

export class MeService {
    static async getMe(userId: number) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: ME_SELECT,
        });

        if (!user) AppError.throw('Usuário não encontrado.', 404);
        ensureAvailable(user);
        return toMeResponse(user);
    }

    static async updateMe(userId: number, payload: UpdateMePayload) {
        const normalized = normalizeUpdatePayload(payload);
        await ensureUsernameAvailable(userId, normalized.username);

        try {
            const updated = await prisma.user.update({
                where: { id: userId },
                data: buildUpdateData(normalized),
                select: ME_SELECT,
            });
            return toMeResponse(updated);
        } catch (error) {
            mapUpdateError(error);
        }
    }

    static async updateMeMultipart(userId: number, req: FastifyRequest) {
        const { payload, uploads: staged } = await parseMultipart(req, userId);
        try {
            await ensureUsernameAvailable(userId, payload.username);
            const result = await prisma.$transaction(async (tx) => {
                const current = await tx.user.update({
                    where: { id: userId },
                    data: { updatedAt: new Date() },
                    select: ME_SELECT,
                });
                ensureAvailable(current);

                const user = await tx.user.update({
                    where: { id: userId },
                    data: buildUpdateData(payload, staged),
                    select: ME_SELECT,
                });

                for (const upload of staged) {
                    await fs.rename(upload.temporaryPath, upload.finalPath);
                }
                return { current, user };
            });

            const oldFiles = staged.flatMap((upload) => {
                const oldUrl = result.current.profile?.[upload.field];
                const oldPath = oldLocalUploadPath(oldUrl, upload.directory);
                return oldPath ? [oldPath] : [];
            });
            await removePaths(oldFiles);
            return toMeResponse(result.user);
        } catch (error) {
            await removePaths(staged.flatMap((upload) => [upload.temporaryPath, upload.finalPath]));
            mapUpdateError(error);
        }
    }

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
            await runMeTransaction(async (tx) => {
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
        const anonymousId = randomUUID();
        const username = `deleted_${userId}_${anonymousId}`;
        const anonymousEmail = `deleted-${userId}-${anonymousId}@deleted.invalid`;
        let deletedProfile: { photo: string | null; banner: string | null } | null;

        try {
            deletedProfile = await runMeTransaction(async (tx) => {
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
                await tx.user.update({
                    where: { id: userId },
                    data: {
                        username,
                        email: anonymousEmail,
                        activate: false,
                        deletedAt,
                        credentialVersion: { increment: 1 },
                    },
                });
                await tx.userProfile.updateMany({
                    where: { userId },
                    data: { photo: null, banner: null, bio: null },
                });
                await recalculateUserReviewGames(tx, userId);
                await detachUserSocialGraph(tx, userId);
                await tx.authSession.updateMany({
                    where: { userId, revokedAt: null },
                    data: { revokedAt: deletedAt },
                });
                return lockedUser.profile;
            });
        } catch (error) {
            if (hasPrismaCode(error, 'P2025')) {
                AppError.throw('Usuário não encontrado.', 404);
            }
            throw error;
        }

        const oldFiles = [
            oldLocalUploadPath(deletedProfile?.photo, 'avatars'),
            oldLocalUploadPath(deletedProfile?.banner, 'banners'),
        ].filter((filepath): filepath is string => filepath !== null);
        await removePaths(oldFiles);

        return { message: 'Conta deletada.', deletedAt: deletedAt.toISOString() };
    }
}
