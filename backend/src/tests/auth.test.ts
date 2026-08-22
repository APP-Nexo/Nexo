import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { closeApp, startApp } from './tests.setup.js';

vi.mock('../shared/utils/prisma/prisma_conn.js', () => ({
    default: {
        user: {
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            updateMany: vi.fn(),
        },
        role: { findUnique: vi.fn() },
        authSession: {
            create: vi.fn(),
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            updateMany: vi.fn(),
        },
        passwordReset: {
            upsert: vi.fn(),
            findUnique: vi.fn(),
            updateMany: vi.fn(),
        },
        $transaction: vi.fn(),
    },
}));

vi.mock('../shared/utils/argon2/encrypt_password.js', () => ({
    encryptPassword: vi.fn(),
}));

vi.mock('../shared/utils/argon2/compare_password.js', () => ({
    comparePassword: vi.fn(),
}));

vi.mock('../shared/utils/email/mailer.js', () => ({
    sendPasswordResetEmail: vi.fn(),
}));

vi.mock('../shared/utils/jwt/jwt_token.js', () => ({
    JwtToken: {
        create: vi.fn(),
        createRefresh: vi.fn(),
        verifyRefresh: vi.fn(),
        getExpiration: vi.fn(),
        getByUser: vi.fn(),
        setCurrentUser: vi.fn(),
    },
}));

import { app } from '../conf.js';
import { comparePassword } from '../shared/utils/argon2/compare_password.js';
import { encryptPassword } from '../shared/utils/argon2/encrypt_password.js';
import { hashOpaqueToken } from '../shared/utils/auth/auth_values.js';
import { sendPasswordResetEmail } from '../shared/utils/email/mailer.js';
import { JwtToken } from '../shared/utils/jwt/jwt_token.js';
import prisma from '../shared/utils/prisma/prisma_conn.js';

const future = new Date('2030-01-01T00:00:00.000Z');

function activeUser(overrides: Record<string, unknown> = {}) {
    return {
        id: 1,
        email: 'test@email.com',
        username: 'testuser',
        password: 'hashed_password',
        roleId: 1,
        credentialVersion: 0,
        activate: true,
        deletedAt: null,
        blockedUser: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    };
}

beforeAll(async () => await startApp());

afterAll(async () => {
    vi.unstubAllEnvs();
    await closeApp();
});

beforeEach(() => {
    vi.resetAllMocks();

    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.authSession.create).mockResolvedValue({} as never);
    vi.mocked(prisma.user.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(prisma.authSession.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(prisma.passwordReset.upsert).mockResolvedValue({} as never);
    vi.mocked(prisma.passwordReset.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(prisma.$transaction).mockImplementation((async (
        callback: (client: typeof prisma) => Promise<unknown>,
    ) => callback(prisma)) as never);

    vi.mocked(encryptPassword).mockResolvedValue('hashed_password');
    vi.mocked(comparePassword).mockResolvedValue(true);
    vi.mocked(sendPasswordResetEmail).mockResolvedValue(undefined);
    vi.mocked(JwtToken.create).mockResolvedValue('access-token');
    vi.mocked(JwtToken.createRefresh).mockResolvedValue('refresh-token');
    vi.mocked(JwtToken.getExpiration).mockReturnValue(future);
    vi.mocked(JwtToken.getByUser).mockResolvedValue({
        sub: '1',
        id: 1,
        email: 'test@email.com',
        roleId: 1,
        typ: 'access',
        sid: 'session-1',
        jti: 'access-jti',
    });
    vi.mocked(JwtToken.setCurrentUser).mockImplementation((req, user) => {
        req.user = user;
    });

    vi.stubEnv('SMTP_HOST', '');
    vi.stubEnv('SMTP_USER', '');
    vi.stubEnv('SMTP_PASS', '');
});

describe('Auth Routes', () => {
    describe('POST /register', () => {
        it('normalizes identity, requires username and persists only the refresh hash', async () => {
            vi.mocked(prisma.role.findUnique).mockResolvedValue({ id: 1, role: 'user' });
            vi.mocked(prisma.user.create).mockResolvedValue(activeUser() as never);

            const response = await app.inject({
                method: 'POST',
                url: '/api/auth/register',
                payload: {
                    username: 'TestUser',
                    email: 'Test@Email.com',
                    password: 'password123',
                    confirmPassword: 'password123',
                },
            });

            expect(response.statusCode).toBe(201);
            expect(response.json()).toEqual({
                tokenType: 'Bearer',
                token: 'access-token',
                refreshToken: 'refresh-token',
                expiresIn: '15m',
            });
            expect(prisma.user.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        username: 'testuser',
                        email: 'test@email.com',
                        password: 'hashed_password',
                    }),
                }),
            );

            const sessionData = vi.mocked(prisma.authSession.create).mock.calls[0]?.[0].data;
            expect(sessionData).toEqual(
                expect.objectContaining({
                    userId: 1,
                    tokenHash: hashOpaqueToken('refresh-token'),
                    expiresAt: future,
                }),
            );
            expect(sessionData?.tokenHash).not.toBe('refresh-token');
            expect(JwtToken.create).toHaveBeenCalledWith(
                expect.objectContaining({ id: 1 }),
                sessionData?.id,
            );
        });

        it('rejects missing or reserved usernames and passwords shorter than ten characters', async () => {
            const missingUsername = await app.inject({
                method: 'POST',
                url: '/api/auth/register',
                payload: {
                    email: 'test@email.com',
                    password: 'password123',
                    confirmPassword: 'password123',
                },
            });
            const shortPassword = await app.inject({
                method: 'POST',
                url: '/api/auth/register',
                payload: {
                    username: 'testuser',
                    email: 'test@email.com',
                    password: 'shortpass',
                    confirmPassword: 'shortpass',
                },
            });
            const reservedUsername = await app.inject({
                method: 'POST',
                url: '/api/auth/register',
                payload: {
                    username: 'ADMIN',
                    email: 'admin@email.com',
                    password: 'password123',
                    confirmPassword: 'password123',
                },
            });

            expect(missingUsername.statusCode).toBe(400);
            expect(shortPassword.statusCode).toBe(400);
            expect(reservedUsername.statusCode).toBe(400);
            expect(prisma.user.create).not.toHaveBeenCalled();
        });
    });

    describe('POST /login', () => {
        it('accepts a normalized email or username identifier', async () => {
            vi.mocked(prisma.user.findFirst).mockResolvedValue(activeUser() as never);

            const response = await app.inject({
                method: 'POST',
                url: '/api/auth/login',
                payload: { identifier: '  TESTUSER  ', password: 'password123' },
            });

            expect(response.statusCode).toBe(200);
            expect(response.json()).toHaveProperty('refreshToken', 'refresh-token');
            expect(prisma.user.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        OR: [
                            { email: { equals: 'testuser', mode: 'insensitive' } },
                            { username: { equals: 'testuser', mode: 'insensitive' } },
                        ],
                    },
                }),
            );
        });

        it('retains the legacy email payload', async () => {
            vi.mocked(prisma.user.findFirst).mockResolvedValue(activeUser() as never);

            const response = await app.inject({
                method: 'POST',
                url: '/api/auth/login',
                payload: { email: 'TEST@EMAIL.COM', password: 'password123' },
            });

            expect(response.statusCode).toBe(200);
            expect(prisma.user.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        OR: expect.arrayContaining([
                            { email: { equals: 'test@email.com', mode: 'insensitive' } },
                        ]),
                    }),
                }),
            );
        });

        it('rejects inactive or blocked users', async () => {
            vi.mocked(prisma.user.findFirst).mockResolvedValue(
                activeUser({ activate: false }) as never,
            );

            const response = await app.inject({
                method: 'POST',
                url: '/api/auth/login',
                payload: { identifier: 'testuser', password: 'password123' },
            });

            expect(response.statusCode).toBe(403);
            expect(prisma.authSession.create).not.toHaveBeenCalled();
        });
    });

    describe('POST /refresh', () => {
        it('rotates the stored hash and returns a new token pair', async () => {
            const incomingRefreshToken = 'incoming-refresh-token';
            vi.mocked(JwtToken.verifyRefresh).mockReturnValue({
                sub: '1',
                id: 1,
                typ: 'refresh',
                sid: 'session-1',
                jti: 'refresh-jti',
            });
            vi.mocked(prisma.authSession.findUnique).mockResolvedValue({
                id: 'session-1',
                userId: 1,
                tokenHash: hashOpaqueToken(incomingRefreshToken),
                familyId: 'family-1',
                expiresAt: future,
                revokedAt: null,
                lastUsedAt: null,
                ipAddress: null,
                userAgent: null,
                credentialVersion: 0,
                createdAt: new Date(),
                user: activeUser(),
            } as never);

            const response = await app.inject({
                method: 'POST',
                url: '/api/auth/refresh',
                payload: { refreshToken: incomingRefreshToken },
            });

            expect(response.statusCode).toBe(200);
            expect(response.json()).toEqual(
                expect.objectContaining({
                    token: 'access-token',
                    refreshToken: 'refresh-token',
                }),
            );
            expect(prisma.authSession.updateMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        id: 'session-1',
                        tokenHash: hashOpaqueToken(incomingRefreshToken),
                        revokedAt: null,
                    }),
                    data: expect.objectContaining({
                        tokenHash: hashOpaqueToken('refresh-token'),
                        lastUsedAt: expect.any(Date),
                    }),
                }),
            );
        });

        it('revokes the token family when a rotated token is reused', async () => {
            vi.mocked(JwtToken.verifyRefresh).mockReturnValue({
                sub: '1',
                id: 1,
                typ: 'refresh',
                sid: 'session-1',
                jti: 'refresh-jti',
            });
            vi.mocked(prisma.authSession.findUnique).mockResolvedValue({
                id: 'session-1',
                userId: 1,
                tokenHash: hashOpaqueToken('current-refresh-token'),
                familyId: 'family-1',
                expiresAt: future,
                revokedAt: null,
                lastUsedAt: null,
                ipAddress: null,
                userAgent: null,
                credentialVersion: 0,
                createdAt: new Date(),
                user: activeUser(),
            } as never);

            const response = await app.inject({
                method: 'POST',
                url: '/api/auth/refresh',
                payload: { refreshToken: 'reused-refresh-token' },
            });

            expect(response.statusCode).toBe(401);
            expect(prisma.authSession.updateMany).toHaveBeenCalledWith({
                where: { familyId: 'family-1', revokedAt: null },
                data: { revokedAt: expect.any(Date) },
            });
        });
    });

    describe('POST /logout', () => {
        it('requires authentication', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/auth/logout',
                payload: { allSessions: false },
            });

            expect(response.statusCode).toBe(401);
        });

        it('revokes every session when requested', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue(activeUser({ roleId: 2 }) as never);
            vi.mocked(prisma.authSession.findFirst).mockResolvedValue({
                id: 'session-1',
                credentialVersion: 0,
            } as never);

            const response = await app.inject({
                method: 'POST',
                url: '/api/auth/logout',
                headers: { authorization: 'Bearer access-token' },
                payload: { allSessions: true },
            });

            expect(response.statusCode).toBe(200);
            expect(prisma.authSession.updateMany).toHaveBeenCalledWith({
                where: { userId: 1, revokedAt: null },
                data: { revokedAt: expect.any(Date) },
            });
            expect(JwtToken.setCurrentUser).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ roleId: 2 }),
            );
        });
    });

    describe('Password reset', () => {
        it('upserts only the reset hash and never returns the token', async () => {
            vi.mocked(prisma.user.findFirst).mockResolvedValue(activeUser() as never);

            const response = await app.inject({
                method: 'POST',
                url: '/api/auth/forgot-password',
                payload: { email: 'TEST@EMAIL.COM' },
            });

            expect(response.statusCode).toBe(200);
            expect(response.json()).toEqual({
                message: 'Se o email existir, você receberá um link de redefinição.',
            });
            expect(response.json()).not.toHaveProperty('token');
            expect(prisma.passwordReset.upsert).toHaveBeenCalledWith({
                where: { userId: 1 },
                create: {
                    userId: 1,
                    tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
                    expiresAt: expect.any(Date),
                },
                update: {
                    tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
                    expiresAt: expect.any(Date),
                    usedAt: null,
                    createdAt: expect.any(Date),
                },
            });
            const resetUpsert = vi.mocked(prisma.passwordReset.upsert).mock.calls[0]?.[0];
            expect(resetUpsert?.update.tokenHash).toBe(resetUpsert?.create.tokenHash);
            expect(resetUpsert?.create).not.toHaveProperty('token');
            expect(resetUpsert?.update).not.toHaveProperty('token');
            expect(prisma.passwordReset.updateMany).not.toHaveBeenCalled();
            expect(sendPasswordResetEmail).not.toHaveBeenCalled();
        });

        it('emails the reset only when SMTP credentials are configured', async () => {
            vi.stubEnv('SMTP_HOST', 'smtp.example.com');
            vi.stubEnv('SMTP_USER', 'smtp-user');
            vi.stubEnv('SMTP_PASS', 'smtp-password');
            vi.mocked(prisma.user.findFirst).mockResolvedValue(activeUser() as never);

            const response = await app.inject({
                method: 'POST',
                url: '/api/auth/forgot-password',
                payload: { email: 'test@email.com' },
            });

            expect(response.statusCode).toBe(200);
            expect(response.json()).not.toHaveProperty('token');
            expect(sendPasswordResetEmail).toHaveBeenCalledWith(
                'test@email.com',
                expect.stringMatching(/^[a-f0-9]{64}$/),
            );
        });

        it('consumes a reset once and revokes all sessions', async () => {
            const rawToken = 'a'.repeat(64);
            vi.mocked(prisma.passwordReset.findUnique).mockResolvedValue({
                id: 'reset-1',
                userId: 1,
                tokenHash: hashOpaqueToken(rawToken),
                expiresAt: future,
                usedAt: null,
                createdAt: new Date(),
                user: activeUser(),
            } as never);

            const response = await app.inject({
                method: 'POST',
                url: '/api/auth/reset-password',
                payload: { token: rawToken, password: 'new-password-123' },
            });

            expect(response.statusCode).toBe(200);
            expect(prisma.passwordReset.findUnique).toHaveBeenCalledWith(
                expect.objectContaining({ where: { tokenHash: hashOpaqueToken(rawToken) } }),
            );
            expect(prisma.passwordReset.updateMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ id: 'reset-1', usedAt: null }),
                }),
            );
            expect(prisma.authSession.updateMany).toHaveBeenCalledWith({
                where: { userId: 1, revokedAt: null },
                data: { revokedAt: expect.any(Date) },
            });
        });

        it('prevents a second success when the conditional consume loses the race', async () => {
            const rawToken = 'b'.repeat(64);
            vi.mocked(prisma.passwordReset.findUnique).mockResolvedValue({
                id: 'reset-2',
                userId: 1,
                tokenHash: hashOpaqueToken(rawToken),
                expiresAt: future,
                usedAt: null,
                createdAt: new Date(),
                user: activeUser(),
            } as never);
            vi.mocked(prisma.passwordReset.updateMany).mockResolvedValueOnce({ count: 0 });

            const response = await app.inject({
                method: 'POST',
                url: '/api/auth/reset-password',
                payload: { token: rawToken, password: 'new-password-123' },
            });

            expect(response.statusCode).toBe(400);
            expect(prisma.user.update).not.toHaveBeenCalled();
            expect(prisma.user.updateMany).not.toHaveBeenCalled();
            expect(prisma.authSession.updateMany).not.toHaveBeenCalled();
        });
    });
});
