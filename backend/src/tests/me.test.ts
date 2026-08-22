import fs from 'node:fs/promises';
import path from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { closeApp, startApp } from './tests.setup.js';

vi.mock('node:fs/promises', () => {
    const mockedFs = {
        mkdir: vi.fn(),
        open: vi.fn(),
        writeFile: vi.fn(),
        rename: vi.fn(),
        unlink: vi.fn(),
    };
    return { default: mockedFs, ...mockedFs };
});

vi.mock('../shared/utils/prisma/prisma_conn.js', () => ({
    default: {
        user: {
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            update: vi.fn(),
            updateMany: vi.fn(),
        },
        userProfile: { updateMany: vi.fn() },
        review: {
            findMany: vi.fn(),
            aggregate: vi.fn(),
        },
        game: { update: vi.fn() },
        userFollow: {
            findMany: vi.fn(),
            deleteMany: vi.fn(),
        },
        notification: { deleteMany: vi.fn() },
        passwordReset: { updateMany: vi.fn() },
        authSession: { updateMany: vi.fn() },
        $transaction: vi.fn(),
    },
}));

vi.mock('../shared/middlewares/check_token.js', () => ({
    checkToken: async (req: any) => {
        req.user = { id: 1, email: 'test@email.com', roleId: 1 };
    },
}));

vi.mock('../shared/utils/argon2/compare_password.js', () => ({
    comparePassword: vi.fn(),
}));

vi.mock('../shared/utils/argon2/encrypt_password.js', () => ({
    encryptPassword: vi.fn(),
}));

import { app } from '../conf.js';
import { comparePassword } from '../shared/utils/argon2/compare_password.js';
import { encryptPassword } from '../shared/utils/argon2/encrypt_password.js';
import prisma from '../shared/utils/prisma/prisma_conn.js';

const createdAt = new Date('2026-01-01T00:00:00.000Z');
let clientAddress = 0;

function nextClientAddress() {
    clientAddress += 1;
    return `192.0.2.${clientAddress}`;
}

function profile(overrides: Record<string, unknown> = {}) {
    return {
        friendlyId: 'profile-1',
        photo: null,
        banner: null,
        bio: 'Hello',
        config: null,
        followersCount: 0,
        followingCount: 0,
        ...overrides,
    };
}

function meRecord(overrides: Record<string, unknown> = {}) {
    return {
        id: 1,
        username: 'testuser',
        email: 'test@email.com',
        roleId: 1,
        createdAt,
        activate: true,
        deletedAt: null,
        blockedUser: null,
        profile: profile(),
        ...overrides,
    };
}

type MultipartPart =
    | { name: string; value: string }
    | { name: string; filename: string; mimetype: string; data: Buffer };

function multipartRequest(parts: MultipartPart[], remoteAddress = nextClientAddress()) {
    const boundary = 'nexo-me-test-boundary';
    const chunks: Buffer[] = [];

    for (const part of parts) {
        chunks.push(Buffer.from(`--${boundary}\r\n`));
        if ('data' in part) {
            chunks.push(
                Buffer.from(
                    `Content-Disposition: form-data; name="${part.name}"; filename="${part.filename}"\r\n` +
                        `Content-Type: ${part.mimetype}\r\n\r\n`,
                ),
                part.data,
                Buffer.from('\r\n'),
            );
        } else {
            chunks.push(
                Buffer.from(
                    `Content-Disposition: form-data; name="${part.name}"\r\n\r\n${part.value}\r\n`,
                ),
            );
        }
    }
    chunks.push(Buffer.from(`--${boundary}--\r\n`));

    return {
        remoteAddress,
        headers: {
            authorization: 'Bearer token',
            'content-type': `multipart/form-data; boundary=${boundary}`,
        },
        payload: Buffer.concat(chunks),
    };
}

beforeAll(async () => await startApp());
afterAll(async () => await closeApp());

beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.userProfile.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(prisma.user.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(prisma.review.findMany).mockResolvedValue([]);
    vi.mocked(prisma.game.update).mockResolvedValue({} as never);
    vi.mocked(prisma.userFollow.findMany).mockResolvedValue([]);
    vi.mocked(prisma.userFollow.deleteMany).mockResolvedValue({ count: 0 });
    vi.mocked(prisma.notification.deleteMany).mockResolvedValue({ count: 0 });
    vi.mocked(prisma.passwordReset.updateMany).mockResolvedValue({ count: 0 });
    vi.mocked(prisma.authSession.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(prisma.$transaction).mockImplementation((async (
        callback: (client: typeof prisma) => Promise<unknown>,
    ) => callback(prisma)) as never);
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.open).mockImplementation(
        async () =>
            ({
                write: vi.fn(async (_buffer: Buffer, _offset: number, length: number) => ({
                    bytesWritten: length,
                })),
                close: vi.fn(async () => undefined),
            }) as never,
    );
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    vi.mocked(fs.rename).mockResolvedValue(undefined);
    vi.mocked(fs.unlink).mockResolvedValue(undefined);
});

describe('Me Routes', () => {
    describe('GET /me', () => {
        it('returns the current profile without password or account state', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(meRecord() as never);

            const response = await app.inject({
                method: 'GET',
                url: '/api/me',
                headers: { authorization: 'Bearer token' },
            });

            expect(response.statusCode).toBe(200);
            expect(response.json()).toEqual({
                id: 1,
                username: 'testuser',
                email: 'test@email.com',
                roleId: 1,
                createdAt: createdAt.toISOString(),
                profile: profile(),
            });
            expect(response.json()).not.toHaveProperty('password');
            expect(response.json()).not.toHaveProperty('activate');
        });

        it.each([
            ['inactive', { activate: false }],
            ['blocked', { blockedUser: { id: 9 } }],
        ])('rejects an %s account', async (_state, overrides) => {
            vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(meRecord(overrides) as never);

            const response = await app.inject({
                method: 'GET',
                url: '/api/me',
                headers: { authorization: 'Bearer token' },
            });

            expect(response.statusCode).toBe(403);
        });
    });

    describe('PUT /me with JSON', () => {
        it('normalizes username, checks it case-insensitively and returns the profile', async () => {
            vi.mocked(prisma.user.update).mockResolvedValueOnce(
                meRecord({
                    username: 'newuser',
                    profile: profile({ bio: 'Updated bio' }),
                }) as never,
            );

            const response = await app.inject({
                method: 'PUT',
                url: '/api/me',
                remoteAddress: nextClientAddress(),
                headers: { authorization: 'Bearer token' },
                payload: { username: '  NewUser  ', bio: 'Updated bio' },
            });

            expect(response.statusCode).toBe(200);
            expect(response.json()).toEqual(
                expect.objectContaining({
                    username: 'newuser',
                    profile: expect.objectContaining({ bio: 'Updated bio' }),
                }),
            );
            expect(response.json()).not.toHaveProperty('message');
            expect(prisma.user.findFirst).toHaveBeenCalledWith({
                where: {
                    id: { not: 1 },
                    username: { equals: 'newuser', mode: 'insensitive' },
                },
                select: { id: true },
            });
            expect(prisma.user.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        username: 'newuser',
                        profile: {
                            upsert: {
                                create: { bio: 'Updated bio' },
                                update: { bio: 'Updated bio' },
                            },
                        },
                    }),
                }),
            );
        });

        it('rejects a case-insensitive username collision', async () => {
            vi.mocked(prisma.user.findFirst).mockResolvedValueOnce({ id: 2 } as never);

            const response = await app.inject({
                method: 'PUT',
                url: '/api/me',
                remoteAddress: nextClientAddress(),
                headers: { authorization: 'Bearer token' },
                payload: { username: 'TAKEN' },
            });

            expect(response.statusCode).toBe(409);
            expect(prisma.user.update).not.toHaveBeenCalled();
        });

        it('maps a raced Prisma unique conflict to 409', async () => {
            vi.mocked(prisma.user.update).mockRejectedValueOnce({ code: 'P2002' } as never);

            const response = await app.inject({
                method: 'PUT',
                url: '/api/me',
                remoteAddress: nextClientAddress(),
                headers: { authorization: 'Bearer token' },
                payload: { username: 'available' },
            });

            expect(response.statusCode).toBe(409);
        });

        it.each([
            [{}, 400],
            [{ roleId: 99 }, 400],
            [{ username: '   ' }, 400],
            [{ bio: 'x'.repeat(501) }, 400],
        ])('rejects an invalid profile payload', async (payload, statusCode) => {
            const response = await app.inject({
                method: 'PUT',
                url: '/api/me',
                remoteAddress: nextClientAddress(),
                headers: { authorization: 'Bearer token' },
                payload,
            });

            expect(response.statusCode).toBe(statusCode);
            expect(prisma.user.update).not.toHaveBeenCalled();
        });
    });

    describe('PUT /me with multipart', () => {
        it('normalizes and updates multipart text fields', async () => {
            vi.mocked(prisma.user.update)
                .mockResolvedValueOnce(meRecord() as never)
                .mockResolvedValueOnce(
                    meRecord({
                        username: 'multipartuser',
                        profile: profile({ bio: 'Multipart bio' }),
                    }) as never,
                );
            const request = multipartRequest([
                { name: 'username', value: '  MultipartUser  ' },
                { name: 'bio', value: 'Multipart bio' },
            ]);

            const response = await app.inject({ method: 'PUT', url: '/api/me', ...request });

            expect(response.statusCode).toBe(200);
            expect(response.json()).toEqual(
                expect.objectContaining({
                    username: 'multipartuser',
                    profile: expect.objectContaining({ bio: 'Multipart bio' }),
                }),
            );
            expect(prisma.user.findFirst).toHaveBeenCalledWith({
                where: {
                    id: { not: 1 },
                    username: { equals: 'multipartuser', mode: 'insensitive' },
                },
                select: { id: true },
            });
            expect(prisma.user.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: {
                        username: 'multipartuser',
                        profile: {
                            upsert: {
                                create: { bio: 'Multipart bio' },
                                update: { bio: 'Multipart bio' },
                            },
                        },
                    },
                }),
            );
        });

        it('rejects unknown fields and malformed image bytes', async () => {
            const unknown = multipartRequest([{ name: 'roleId', value: '99' }]);
            const malformed = multipartRequest([
                {
                    name: 'photo',
                    filename: '../../avatar.jpg',
                    mimetype: 'image/jpeg',
                    data: Buffer.from('not-an-image'),
                },
            ]);

            const unknownResponse = await app.inject({
                method: 'PUT',
                url: '/api/me',
                ...unknown,
            });
            const malformedResponse = await app.inject({
                method: 'PUT',
                url: '/api/me',
                ...malformed,
            });

            expect(unknownResponse.statusCode).toBe(400);
            expect(malformedResponse.statusCode).toBe(400);
            expect(prisma.user.update).not.toHaveBeenCalled();
            expect(fs.open).toHaveBeenCalledOnce();
            expect(fs.writeFile).not.toHaveBeenCalled();
        });

        it('maps a structurally malformed multipart stream to 400', async () => {
            const boundary = 'broken-boundary';
            const response = await app.inject({
                method: 'PUT',
                url: '/api/me',
                remoteAddress: nextClientAddress(),
                headers: {
                    authorization: 'Bearer token',
                    'content-type': `multipart/form-data; boundary=${boundary}`,
                },
                payload: Buffer.from(
                    `--${boundary}\r\nContent-Disposition: form-data; name="bio"\r\n\r\nincomplete`,
                ),
            });

            expect(response.statusCode).toBe(400);
            expect(prisma.user.update).not.toHaveBeenCalled();
        });

        it('rejects a supplied MIME that disagrees with the magic bytes', async () => {
            const request = multipartRequest([
                {
                    name: 'photo',
                    filename: 'avatar.jpg',
                    mimetype: 'image/jpeg',
                    data: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
                },
            ]);

            const response = await app.inject({ method: 'PUT', url: '/api/me', ...request });

            expect(response.statusCode).toBe(400);
            expect(response.json().message).toContain('MIME');
            expect(fs.open).toHaveBeenCalledOnce();
            expect(fs.writeFile).not.toHaveBeenCalled();
        });

        it('detects extensions, promotes staged files and removes only an old local file', async () => {
            const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
            const webp = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP')]);
            vi.mocked(prisma.user.update)
                .mockResolvedValueOnce(
                    meRecord({
                        profile: profile({
                            photo: '/uploads/avatars/old.jpg',
                            banner: 'https://cdn.example.com/banner.webp',
                        }),
                    }) as never,
                )
                .mockResolvedValueOnce(
                    meRecord({
                        profile: profile({
                            photo: '/uploads/avatars/updated.png',
                            banner: '/uploads/banners/updated.webp',
                        }),
                    }) as never,
                );
            const request = multipartRequest([
                {
                    name: 'photo',
                    filename: '../../avatar.php',
                    mimetype: 'image/png',
                    data: png,
                },
                {
                    name: 'banner',
                    filename: 'banner.jpg',
                    mimetype: 'image/webp',
                    data: webp,
                },
            ]);

            const response = await app.inject({ method: 'PUT', url: '/api/me', ...request });

            expect(response.statusCode).toBe(200);
            const update = vi.mocked(prisma.user.update).mock.calls[1]?.[0] as any;
            expect(update.data.profile.upsert.update.photo).toMatch(
                /^\/uploads\/avatars\/1_[0-9a-f-]+\.png$/,
            );
            expect(update.data.profile.upsert.update.banner).toMatch(
                /^\/uploads\/banners\/1_[0-9a-f-]+\.webp$/,
            );
            expect(fs.open).toHaveBeenCalledTimes(2);
            expect(fs.writeFile).not.toHaveBeenCalled();
            expect(fs.rename).toHaveBeenCalledTimes(2);
            for (const [, finalPath] of vi.mocked(fs.rename).mock.calls) {
                expect(finalPath).toMatch(/\/public\/(avatars|banners)\/1_[0-9a-f-]+\.(png|webp)$/);
                expect(finalPath).not.toContain('.php');
            }
            expect(fs.unlink).toHaveBeenCalledTimes(1);
            expect(fs.unlink).toHaveBeenCalledWith(
                path.resolve(process.cwd(), 'public', 'avatars', 'old.jpg'),
            );
        });

        it('cleans staged and final paths when the database update fails', async () => {
            vi.mocked(prisma.user.update)
                .mockResolvedValueOnce(meRecord() as never)
                .mockRejectedValueOnce({ code: 'P2002' } as never);
            const request = multipartRequest([
                {
                    name: 'photo',
                    filename: 'avatar.png',
                    mimetype: 'image/png',
                    data: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
                },
            ]);

            const response = await app.inject({ method: 'PUT', url: '/api/me', ...request });

            expect(response.statusCode).toBe(409);
            expect(fs.open).toHaveBeenCalledOnce();
            expect(fs.writeFile).not.toHaveBeenCalled();
            expect(fs.rename).not.toHaveBeenCalled();
            expect(fs.unlink).toHaveBeenCalledTimes(2);
            for (const [filepath] of vi.mocked(fs.unlink).mock.calls) {
                expect(filepath).toMatch(/\/public\/avatars\//);
            }
        });

        it('limits upload attempts separately from JSON profile updates', async () => {
            const remoteAddress = '198.51.100.200';
            const statuses: number[] = [];
            for (let attempt = 0; attempt < 6; attempt += 1) {
                const request = multipartRequest([{ name: 'roleId', value: '99' }], remoteAddress);
                const response = await app.inject({ method: 'PUT', url: '/api/me', ...request });
                statuses.push(response.statusCode);
            }

            expect(statuses).toEqual([400, 400, 400, 400, 400, 429]);

            const jsonResponse = await app.inject({
                method: 'PUT',
                url: '/api/me',
                remoteAddress,
                headers: { authorization: 'Bearer token' },
                payload: {},
            });
            expect(jsonResponse.statusCode).toBe(400);
        });
    });

    describe('PUT /me/password', () => {
        it('changes the password and revokes every session in one transaction', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
                password: 'old_hash',
                credentialVersion: 0,
            } as never);
            vi.mocked(comparePassword).mockResolvedValueOnce(true);
            vi.mocked(encryptPassword).mockResolvedValueOnce('new_hash');

            const response = await app.inject({
                method: 'PUT',
                url: '/api/me/password',
                headers: { authorization: 'Bearer token' },
                payload: {
                    currentPassword: 'old-password-123',
                    newPassword: 'new-password-456',
                },
            });

            expect(response.statusCode).toBe(200);
            expect(prisma.$transaction).toHaveBeenCalledOnce();
            expect(prisma.user.updateMany).toHaveBeenCalledWith({
                where: expect.objectContaining({ id: 1, credentialVersion: 0 }),
                data: expect.objectContaining({ password: 'new_hash' }),
            });
            expect(prisma.authSession.updateMany).toHaveBeenCalledWith({
                where: { userId: 1, revokedAt: null },
                data: { revokedAt: expect.any(Date) },
            });
        });

        it('rejects short and unchanged passwords', async () => {
            const shortResponse = await app.inject({
                method: 'PUT',
                url: '/api/me/password',
                headers: { authorization: 'Bearer token' },
                payload: { currentPassword: 'old-password-123', newPassword: 'short' },
            });

            vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
                password: 'old_hash',
            } as never);
            vi.mocked(comparePassword).mockResolvedValueOnce(true);
            const sameResponse = await app.inject({
                method: 'PUT',
                url: '/api/me/password',
                headers: { authorization: 'Bearer token' },
                payload: {
                    currentPassword: 'same-password-123',
                    newPassword: 'same-password-123',
                },
            });

            expect(shortResponse.statusCode).toBe(400);
            expect(sameResponse.statusCode).toBe(400);
            expect(encryptPassword).not.toHaveBeenCalled();
            expect(prisma.$transaction).not.toHaveBeenCalled();
        });
    });

    describe('DELETE /me', () => {
        it('requires the password and cleans profile, social and rating state', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
                password: 'stored_hash',
            } as never);
            vi.mocked(comparePassword).mockResolvedValue(true);
            vi.mocked(prisma.user.update)
                .mockResolvedValueOnce({
                    password: 'stored_hash',
                    activate: true,
                    deletedAt: null,
                    blockedUser: null,
                    profile: {
                        photo: '/uploads/avatars/old.jpg',
                        banner: '/uploads/banners/old.webp',
                    },
                } as never)
                .mockResolvedValueOnce({} as never);
            vi.mocked(prisma.review.findMany).mockResolvedValueOnce([{ gameId: 7 }] as never);
            vi.mocked(prisma.review.aggregate).mockResolvedValueOnce({
                _sum: { rating: 8 },
                _count: 2,
            } as never);
            vi.mocked(prisma.userFollow.findMany).mockResolvedValueOnce([
                { followerId: 1, followingId: 2 },
                { followerId: 3, followingId: 1 },
            ] as never);

            const response = await app.inject({
                method: 'DELETE',
                url: '/api/me',
                headers: { authorization: 'Bearer token' },
                payload: { password: 'password123' },
            });

            expect(response.statusCode).toBe(200);
            expect(comparePassword).toHaveBeenCalledWith('password123', 'stored_hash');
            expect(comparePassword).toHaveBeenCalledTimes(2);
            expect(prisma.$transaction).toHaveBeenCalledOnce();
            const update = vi.mocked(prisma.user.update).mock.calls[1]?.[0] as any;
            expect(update.data).toEqual(
                expect.objectContaining({
                    username: expect.stringMatching(/^deleted_1_[0-9a-f-]+$/),
                    email: expect.stringMatching(/^deleted-1-[0-9a-f-]+@deleted\.invalid$/),
                    activate: false,
                    deletedAt: expect.any(Date),
                }),
            );
            expect(update.data.username).not.toContain('testuser');
            expect(update.data.email).not.toContain('test@email.com');
            expect(prisma.userProfile.updateMany).toHaveBeenCalledWith({
                where: { userId: 1 },
                data: { photo: null, banner: null, bio: null },
            });
            expect(prisma.review.findMany).toHaveBeenCalledWith({
                where: { userId: 1, status: 'approved', deletedAt: null },
                select: { gameId: true },
                distinct: ['gameId'],
            });
            expect(prisma.game.update).toHaveBeenCalledWith({
                where: { id: 7 },
                data: { ratingSum: 8, ratingCount: 2, averageRating: 4 },
            });
            expect(prisma.userFollow.deleteMany).toHaveBeenCalledWith({
                where: { OR: [{ followerId: 1 }, { followingId: 1 }] },
            });
            expect(prisma.userProfile.updateMany).toHaveBeenCalledWith({
                where: { userId: { in: [2] }, followersCount: { gt: 0 } },
                data: { followersCount: { decrement: 1 } },
            });
            expect(prisma.userProfile.updateMany).toHaveBeenCalledWith({
                where: { userId: { in: [3] }, followingCount: { gt: 0 } },
                data: { followingCount: { decrement: 1 } },
            });
            expect(prisma.userProfile.updateMany).toHaveBeenCalledWith({
                where: { userId: 1 },
                data: { followersCount: 0, followingCount: 0 },
            });
            expect(prisma.notification.deleteMany).toHaveBeenCalledWith({
                where: {
                    type: 'follow',
                    OR: [{ toUserId: 1 }, { fromUserId: 1 }],
                },
            });
            expect(prisma.authSession.updateMany).toHaveBeenCalledWith({
                where: { userId: 1, revokedAt: null },
                data: { revokedAt: update.data.deletedAt },
            });
            expect(fs.unlink).toHaveBeenCalledWith(
                path.resolve(process.cwd(), 'public', 'avatars', 'old.jpg'),
            );
            expect(fs.unlink).toHaveBeenCalledWith(
                path.resolve(process.cwd(), 'public', 'banners', 'old.webp'),
            );
        });

        it('rejects an incorrect password before cleanup', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
                password: 'stored_hash',
                profile: { photo: null, banner: null },
            } as never);
            vi.mocked(comparePassword).mockResolvedValueOnce(false);

            const response = await app.inject({
                method: 'DELETE',
                url: '/api/me',
                headers: { authorization: 'Bearer token' },
                payload: { password: 'wrong-password' },
            });

            expect(response.statusCode).toBe(403);
            expect(prisma.$transaction).not.toHaveBeenCalled();
        });
    });
});
