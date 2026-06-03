import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { closeApp, startApp } from './tests.setup.js';

vi.mock('../shared/utils/prisma/prisma_conn.js', () => ({
    default: {
        user: { findUnique: vi.fn(), update: vi.fn() },
        userProfile: { upsert: vi.fn() },
    },
}));

vi.mock('../shared/middlewares/check_token.js', () => ({
    checkToken: async (req: any, _reply: any) => {
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

beforeAll(async () => await startApp());
afterAll(async () => await closeApp());

beforeEach(() => {
    vi.clearAllMocks();
});

describe('Me Routes', () => {
    describe('GET /me', () => {
        it('should return current user profile', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
                id: 1,
                email: 'test@email.com',
                username: 'testuser',
                password: 'hash',
                roleId: 1,
                activate: true,
                createdAt: new Date(),
                deletedAt: null,
                profile: {
                    photo: null,
                    banner: null,
                    bio: 'Hello',
                    followersCount: 0,
                    followingCount: 0,
                },
            } as any);

            const response = await app.inject({
                method: 'GET',
                url: '/api/me',
                headers: { authorization: 'Bearer token' },
            });

            expect(response.statusCode).toBe(200);
            const body = response.json();
            expect(body).toHaveProperty('username', 'testuser');
            expect(body).not.toHaveProperty('password');
        });
    });

    describe('PUT /me', () => {
        it('should update current user profile', async () => {
            vi.mocked(prisma.user.update).mockResolvedValueOnce({ id: 1 } as any);

            const response = await app.inject({
                method: 'PUT',
                url: '/api/me',
                headers: { authorization: 'Bearer token' },
                payload: { bio: 'Updated bio' },
            });

            expect(response.statusCode).toBe(200);
            expect(response.json()).toHaveProperty('message');
        });
    });

    describe('PUT /me/password', () => {
        it('should change password', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
                id: 1,
                password: 'old_hash',
            } as any);
            vi.mocked(comparePassword).mockResolvedValueOnce(true);
            vi.mocked(encryptPassword).mockResolvedValueOnce('new_hash');
            vi.mocked(prisma.user.update).mockResolvedValueOnce({} as any);

            const response = await app.inject({
                method: 'PUT',
                url: '/api/me/password',
                headers: { authorization: 'Bearer token' },
                payload: { currentPassword: 'old', newPassword: 'new123' },
            });

            expect(response.statusCode).toBe(200);
        });
    });

    describe('DELETE /me', () => {
        it('should delete account', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
                id: 1,
                email: 'test@email.com',
            } as any);
            vi.mocked(prisma.user.update).mockResolvedValueOnce({} as any);

            const response = await app.inject({
                method: 'DELETE',
                url: '/api/me',
                headers: { authorization: 'Bearer token' },
                payload: { email: 'test@email.com' },
            });

            expect(response.statusCode).toBe(200);
        });
    });
});
