import type { FastifyRequest } from 'fastify';
import type { Prisma } from '../../../generated/client.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { hasPrismaCode } from '../../../shared/infrastructure/database/prisma-errors.js';
import { comparePassword } from '../../../shared/utils/argon2/compare_password.js';
import {
    USERNAME_MAX_LENGTH as AUTH_USERNAME_MAX_LENGTH,
    USERNAME_MIN_LENGTH as AUTH_USERNAME_MIN_LENGTH,
    isReservedUsername,
    isValidUsername,
    normalizeUsername,
} from '../../../shared/utils/auth/auth_values.js';
import prisma from '../../../shared/utils/prisma/prisma_conn.js';
import {
    commitProfileUploads,
    localProfileFilePath,
    parseProfileMultipart,
    removeProfileFiles,
    type StagedUpload,
} from '../infrastructure/profile-upload.storage.js';
import {
    BIO_MAX_LENGTH,
    type UpdateMePayload,
    USERNAME_MAX_LENGTH,
    USERNAME_MIN_LENGTH,
} from '../me.interfaces.js';

const JSON_FIELDS = new Set(['username', 'bio', 'photo', 'banner']);

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
    if (keys.some((key) => !JSON_FIELDS.has(key))) {
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
            if (isReservedUsername(username)) {
                AppError.throw('Este nome de usuário é reservado e não pode ser usado.', 400);
            }
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

    // photo/banner can only be *set* via multipart upload; here they can only
    // be cleared, so the only value this JSON path accepts is null.
    if (Object.hasOwn(input, 'photo')) {
        if (input.photo !== null) {
            AppError.throw('Envie um upload para definir a foto, ou null para remover.', 400);
        }
        normalized.photo = null;
    }
    if (Object.hasOwn(input, 'banner')) {
        if (input.banner !== null) {
            AppError.throw('Envie um upload para definir o banner, ou null para remover.', 400);
        }
        normalized.banner = null;
    }

    if (
        !allowEmpty &&
        normalized.username === undefined &&
        normalized.bio === undefined &&
        normalized.photo === undefined &&
        normalized.banner === undefined
    ) {
        AppError.throw('Informe ao menos um campo para atualizar.', 400);
    }
    return normalized;
}

function payloadHasUsername(payload: UpdateMePayload): boolean {
    return typeof (payload as Record<string, unknown>).username === 'string';
}

async function isMasterAccount(userId: number): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: { select: { role: true } } },
    });
    return user?.role.role === 'master';
}

async function ensureUsernameChangeAllowed(userId: number, payload: UpdateMePayload) {
    if (!payloadHasUsername(payload)) return;
    if (await isMasterAccount(userId)) {
        AppError.throw('O nome de usuário da conta master não pode ser alterado.', 400);
    }
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
    const profileData: { bio?: string; photo?: string | null; banner?: string | null } = {};
    if (payload.bio !== undefined) profileData.bio = payload.bio;
    if (payload.photo === null) profileData.photo = null;
    if (payload.banner === null) profileData.banner = null;
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

export class MeProfileService {
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
        await ensureUsernameChangeAllowed(userId, payload);
        const normalized = normalizeUpdatePayload(payload);
        await ensureUsernameAvailable(userId, normalized.username);

        const removingPhoto = normalized.photo === null;
        const removingBanner = normalized.banner === null;

        try {
            const current =
                removingPhoto || removingBanner
                    ? await prisma.user.findUnique({
                          where: { id: userId },
                          select: { profile: { select: { photo: true, banner: true } } },
                      })
                    : null;

            const updated = await prisma.user.update({
                where: { id: userId },
                data: buildUpdateData(normalized),
                select: ME_SELECT,
            });

            const oldFiles = [
                removingPhoto ? localProfileFilePath(current?.profile?.photo, 'avatars') : null,
                removingBanner ? localProfileFilePath(current?.profile?.banner, 'banners') : null,
            ].filter((path): path is string => path !== null);
            if (oldFiles.length > 0) await removeProfileFiles(oldFiles);

            return toMeResponse(updated);
        } catch (error) {
            mapUpdateError(error);
        }
    }

    static async updateMeMultipart(userId: number, req: FastifyRequest) {
        const parsed = await parseProfileMultipart(req, userId);
        await ensureUsernameChangeAllowed(userId, parsed.payload);
        const payload = normalizeUpdatePayload(parsed.payload, true);
        const staged = parsed.uploads;

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

                await commitProfileUploads(staged);
                return { current, user };
            });

            const oldFiles = staged.flatMap((upload) => {
                const oldUrl = result.current.profile?.[upload.field];
                const oldPath = localProfileFilePath(oldUrl, upload.directory);
                return oldPath ? [oldPath] : [];
            });
            await removeProfileFiles(oldFiles);
            return toMeResponse(result.user);
        } catch (error) {
            await removeProfileFiles(
                staged.flatMap((upload) => [upload.temporaryPath, upload.finalPath]),
            );
            mapUpdateError(error);
        }
    }
}
