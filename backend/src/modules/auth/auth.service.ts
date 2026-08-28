import { randomBytes, randomUUID } from 'node:crypto';
import type { Prisma } from '../../generated/client.js';
import { hasPrismaCode } from '../../shared/infrastructure/database/prisma-errors.js';
import { runSerializableTransaction } from '../../shared/infrastructure/database/transactions.js';
import { comparePassword } from '../../shared/utils/argon2/compare_password.js';
import { encryptPassword } from '../../shared/utils/argon2/encrypt_password.js';
import {
    hashOpaqueToken,
    normalizeEmail,
    normalizeUsername,
} from '../../shared/utils/auth/auth_values.js';
import { sendPasswordResetEmail } from '../../shared/utils/email/mailer.js';
import type { TokenUser } from '../../shared/utils/jwt/jwt.interfaces.js';
import { JwtToken } from '../../shared/utils/jwt/jwt_token.js';
import prisma from '../../shared/utils/prisma/prisma_conn.js';
import { AuthErrors } from './auth.errors.js';
import type { AuthResponse, RegisterPayload, SessionMetadata } from './auth.interfaces.js';

type AvailableUser = {
    activate: boolean;
    deletedAt: Date | null;
    blockedUser: { id: number } | null;
};

function ensureUserAvailable(user: AvailableUser) {
    if (!user.activate || user.deletedAt || user.blockedUser) {
        AuthErrors.throwAccountUnavailable();
    }
}

function sessionMetadata(metadata: SessionMetadata) {
    const ipAddress = metadata.ipAddress?.trim().slice(0, 255);
    const userAgent = metadata.userAgent?.trim().slice(0, 512);

    return {
        ...(ipAddress ? { ipAddress } : {}),
        ...(userAgent ? { userAgent } : {}),
    };
}

function smtpConfigured() {
    return Boolean(
        process.env.SMTP_HOST?.trim() &&
            process.env.SMTP_USER?.trim() &&
            process.env.SMTP_PASS?.trim(),
    );
}

let dummyPasswordHash: Promise<string> | undefined;
const REFRESH_REUSE_GRACE_MS = 10_000;

function getDummyPasswordHash() {
    dummyPasswordHash ??= encryptPassword('nexo-invalid-credential-placeholder');
    return dummyPasswordHash;
}

export class AuthService {
    private static async issueSession(
        user: TokenUser,
        metadata: SessionMetadata = {},
        database: Pick<Prisma.TransactionClient, 'authSession'> = prisma,
        credentialVersion = 0,
    ): Promise<AuthResponse> {
        const sessionId = randomUUID();
        const familyId = randomUUID();
        const [token, refreshToken] = await Promise.all([
            JwtToken.create(user, sessionId),
            JwtToken.createRefresh(user, sessionId),
        ]);

        await database.authSession.create({
            data: {
                id: sessionId,
                userId: user.id,
                tokenHash: hashOpaqueToken(refreshToken),
                previousTokenHash: null,
                previousTokenExpiresAt: null,
                familyId,
                expiresAt: JwtToken.getExpiration(refreshToken),
                credentialVersion,
                ...sessionMetadata(metadata),
            },
        });

        return {
            tokenType: process.env.TOKEN_TYPE ?? 'Bearer',
            token,
            refreshToken,
            expiresIn: process.env.TOKEN_EXPIRES ?? '15m',
        };
    }

    static async register(payload: RegisterPayload, metadata: SessionMetadata = {}) {
        const username = normalizeUsername(payload.username);
        const email = normalizeEmail(payload.email);
        const normalizedPayload = { ...payload, username, email };

        AuthErrors.ensureDataRegister(normalizedPayload);

        const emailInUse = await prisma.user.findFirst({
            where: { email: { equals: email, mode: 'insensitive' } },
            select: { id: true },
        });
        if (emailInUse) AuthErrors.throw('Email indisponível.', 409);

        const usernameInUse = await prisma.user.findFirst({
            where: { username: { equals: username, mode: 'insensitive' } },
            select: { id: true },
        });
        if (usernameInUse) AuthErrors.throw('Username indisponível.', 409);

        const defaultRole = await prisma.role.findUnique({ where: { role: 'user' } });
        if (!defaultRole) AuthErrors.throw('Perfil padrão não configurado.', 500);

        const password = await encryptPassword(payload.password);
        try {
            return await runSerializableTransaction(prisma, async (tx) => {
                const createdUser = await tx.user.create({
                    data: {
                        username,
                        email,
                        password,
                        roleId: defaultRole.id,
                        profile: { create: {} },
                    },
                });
                return AuthService.issueSession(
                    createdUser,
                    metadata,
                    tx,
                    createdUser.credentialVersion,
                );
            });
        } catch (error) {
            if (hasPrismaCode(error, 'P2002')) {
                AuthErrors.throw('Email ou username indisponível.', 409);
            }
            throw error;
        }
    }

    static async login(identifier: string, password: string, metadata: SessionMetadata = {}) {
        const normalizedIdentifier = normalizeUsername(identifier);
        AuthErrors.ensureDataLogin(normalizedIdentifier, password);

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: { equals: normalizedIdentifier, mode: 'insensitive' } },
                    { username: { equals: normalizedIdentifier, mode: 'insensitive' } },
                ],
            },
            include: { blockedUser: { select: { id: true } } },
        });

        if (!user) {
            await comparePassword(password, await getDummyPasswordHash());
            AuthErrors.throwInvalidCredentials();
        }
        AuthErrors.ensureMatchPassword(await comparePassword(password, user.password));
        ensureUserAvailable(user);

        return runSerializableTransaction(prisma, async (tx) => {
            const locked = await tx.user.updateMany({
                where: {
                    id: user.id,
                    password: user.password,
                    credentialVersion: user.credentialVersion,
                    activate: true,
                    deletedAt: null,
                    blockedUser: null,
                },
                data: { credentialVersion: user.credentialVersion },
            });
            if (locked.count !== 1) AuthErrors.throwInvalidCredentials();
            return AuthService.issueSession(user, metadata, tx, user.credentialVersion);
        });
    }

    static async refresh(incomingRefreshToken: string, metadata: SessionMetadata = {}) {
        AuthErrors.ensureRefreshToken(incomingRefreshToken);
        const payload = JwtToken.verifyRefresh(incomingRefreshToken);
        const incomingHash = hashOpaqueToken(incomingRefreshToken);
        const now = new Date();

        const result = await prisma.$transaction(async (tx) => {
            const session = await tx.authSession.findUnique({
                where: { id: payload.sid },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            roleId: true,
                            credentialVersion: true,
                            activate: true,
                            deletedAt: true,
                            blockedUser: { select: { id: true } },
                        },
                    },
                },
            });

            if (!session || session.userId !== payload.id) return { status: 'invalid' } as const;

            if (session.tokenHash !== incomingHash) {
                if (
                    session.previousTokenHash === incomingHash &&
                    session.previousTokenExpiresAt &&
                    session.previousTokenExpiresAt > now
                ) {
                    return { status: 'invalid' } as const;
                }
                await tx.authSession.updateMany({
                    where: { familyId: session.familyId, revokedAt: null },
                    data: { revokedAt: now },
                });
                return { status: 'reuse' } as const;
            }

            if (session.revokedAt || session.expiresAt <= now) {
                return { status: 'invalid' } as const;
            }

            if (session.credentialVersion !== session.user.credentialVersion) {
                await tx.authSession.updateMany({
                    where: { familyId: session.familyId, revokedAt: null },
                    data: { revokedAt: now },
                });
                return { status: 'invalid' } as const;
            }

            if (!session.user.activate || session.user.deletedAt || session.user.blockedUser) {
                await tx.authSession.updateMany({
                    where: { familyId: session.familyId, revokedAt: null },
                    data: { revokedAt: now },
                });
                return { status: 'unavailable' } as const;
            }

            const [token, refreshToken] = await Promise.all([
                JwtToken.create(session.user, session.id),
                JwtToken.createRefresh(session.user, session.id),
            ]);
            const nextTokenHash = hashOpaqueToken(refreshToken);
            const expiresAt = JwtToken.getExpiration(refreshToken);

            const rotation = await tx.authSession.updateMany({
                where: {
                    id: session.id,
                    userId: session.userId,
                    tokenHash: incomingHash,
                    revokedAt: null,
                    expiresAt: { gt: now },
                },
                data: {
                    tokenHash: nextTokenHash,
                    expiresAt,
                    lastUsedAt: now,
                    previousTokenHash: incomingHash,
                    previousTokenExpiresAt: new Date(now.getTime() + REFRESH_REUSE_GRACE_MS),
                    ...sessionMetadata(metadata),
                },
            });

            if (rotation.count !== 1) {
                return { status: 'invalid' } as const;
            }

            return {
                status: 'ok',
                response: {
                    tokenType: process.env.TOKEN_TYPE ?? 'Bearer',
                    token,
                    refreshToken,
                    expiresIn: process.env.TOKEN_EXPIRES ?? '15m',
                },
            } as const;
        });

        if (result.status === 'unavailable') AuthErrors.throwAccountUnavailable();
        if (result.status !== 'ok') {
            AuthErrors.throw('Refresh token inválido ou expirado.', 401);
        }
        return result.response;
    }

    static async logout(userId: number, sessionId: string, allSessions = false) {
        await prisma.authSession.updateMany({
            where: {
                userId,
                revokedAt: null,
                ...(allSessions ? {} : { id: sessionId }),
            },
            data: { revokedAt: new Date() },
        });
    }

    static async forgotPassword(email: string) {
        const normalizedEmail = normalizeEmail(email);
        AuthErrors.ensureEmail(normalizedEmail);

        const user = await prisma.user.findFirst({
            where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
            include: { blockedUser: { select: { id: true } } },
        });
        if (!user?.activate || user.deletedAt || user.blockedUser) return;

        const token = randomBytes(32).toString('hex');
        const tokenHash = hashOpaqueToken(token);
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        await prisma.passwordReset.upsert({
            where: { userId: user.id },
            create: { userId: user.id, tokenHash, expiresAt },
            update: { tokenHash, expiresAt, usedAt: null, createdAt: new Date() },
        });

        if (smtpConfigured()) {
            void sendPasswordResetEmail(user.email, token).catch(() => undefined);
        }
    }

    static async resetPassword(token: string, newPassword: string) {
        if (!token) AuthErrors.throwMissing('token');
        AuthErrors.ensurePassword(newPassword);

        const tokenHash = hashOpaqueToken(token);
        const hashedPassword = await encryptPassword(newPassword);
        const now = new Date();

        const consumed = await runSerializableTransaction(prisma, async (tx) => {
            const reset = await tx.passwordReset.findUnique({
                where: { tokenHash },
                include: {
                    user: {
                        select: {
                            activate: true,
                            deletedAt: true,
                            credentialVersion: true,
                            blockedUser: { select: { id: true } },
                        },
                    },
                },
            });

            if (
                !reset ||
                reset.usedAt ||
                reset.expiresAt <= now ||
                !reset.user.activate ||
                reset.user.deletedAt ||
                reset.user.blockedUser
            ) {
                return false;
            }

            const claim = await tx.passwordReset.updateMany({
                where: { id: reset.id, usedAt: null, expiresAt: { gt: now } },
                data: { usedAt: now },
            });
            if (claim.count !== 1) return false;

            const updated = await tx.user.updateMany({
                where: { id: reset.userId },
                data: { password: hashedPassword, credentialVersion: { increment: 1 } },
            });
            if (updated.count !== 1) return false;
            await tx.passwordReset.updateMany({
                where: { userId: reset.userId, usedAt: null },
                data: { usedAt: now },
            });
            await tx.authSession.updateMany({
                where: { userId: reset.userId, revokedAt: null },
                data: { revokedAt: now },
            });
            return true;
        });

        if (!consumed) AuthErrors.throw('Token inválido ou expirado.', 400);
    }
}
