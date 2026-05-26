import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { closeApp, startApp } from './tests.setup.js';

// ================================================================
//  SETUP MOCKS - Must be declared before imports to ensure hoisting
// =================================================================
vi.mock('../shared/utils/prisma/prisma_conn.js', () => ({
    default: {
        user: { findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
        role: { findUnique: vi.fn() },
        vwUserPublic: { findUnique: vi.fn() },
    },
}));

vi.mock('../shared/middlewares/check_token.js', () => ({
    checkToken: async (req: any, _reply: any) => {
        req.user = {
            id: 1,
            name: 'Master User',
            email: 'master@email.com',
            roleId: 3,
        };
    },
}));

vi.mock('../shared/middlewares/check_acess_master.js', () => ({
    checkAccessMaster: async (_req: any, _reply: any) => {},
}));

// ============================================================
//  IMPORTS - After mocks are hoisted
// ============================================================
import { app } from '../conf.js';
import prisma from '../shared/utils/prisma/prisma_conn.js';

// ============================================================
//  TESTS
// ============================================================
beforeAll(async () => await startApp());
afterAll(async () => await closeApp());

beforeEach(() => {
    vi.clearAllMocks();
});

describe('Master Routes', () => {
    describe('PATCH /user/:id/promote', () => {
        it('should promote a user to admin successfully', async () => {
            // ensureNotMaster: user.findUnique com include role
            vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
                id: 2,
                roleId: 1,
                role: { role: 'user' },
            } as any);

            // ensureUserExistById: user.findUnique
            vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
                id: 2,
                name: 'User to Promote',
                email: 'user@email.com',
                roleId: 1,
            } as any);

            // role.findUnique
            vi.mocked(prisma.role.findUnique).mockResolvedValueOnce({
                id: 2,
                role: 'admin',
            } as any);

            // ensureRole: user.findUnique
            vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
                id: 2,
                roleId: 1,
            } as any);

            // user.update
            vi.mocked(prisma.user.update).mockResolvedValueOnce({
                id: 2,
                roleId: 2,
            } as any);

            // vwUserPublic.findUnique
            vi.mocked(prisma.vwUserPublic.findUnique).mockResolvedValueOnce({
                id: 2,
                email: 'user@email.com',
            } as any);

            const response = await app.inject({
                method: 'PATCH',
                url: '/api/master/user/2/promote',
                headers: { authorization: 'Bearer mocked_token_12345' },
            });

            expect(response.statusCode).toBe(200);
            expect(response.json()).toHaveProperty('message');
            expect(response.json()).toHaveProperty('role');
            expect(response.json().role).toBe('admin');
        });
    });

    describe('PATCH /user/:id/demote', () => {
        it('should demote a user to user role successfully', async () => {
            // ensureNotMaster
            vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
                id: 2,
                roleId: 2,
                role: { role: 'user' },
            } as any);

            // ensureUserExistById
            vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
                id: 2,
                name: 'Admin to Demote',
                email: 'admin@email.com',
                roleId: 2,
            } as any);

            // role.findUnique
            vi.mocked(prisma.role.findUnique).mockResolvedValueOnce({
                id: 1,
                role: 'user',
            } as any);

            // ensureRole
            vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
                id: 2,
                roleId: 2,
            } as any);

            // user.update
            vi.mocked(prisma.user.update).mockResolvedValueOnce({
                id: 2,
                roleId: 1,
            } as any);

            // vwUserPublic.findUnique
            vi.mocked(prisma.vwUserPublic.findUnique).mockResolvedValueOnce({
                id: 2,
                email: 'admin@email.com',
            } as any);

            const response = await app.inject({
                method: 'PATCH',
                url: '/api/master/user/2/demote',
                headers: { authorization: 'Bearer mocked_token_12345' },
            });

            expect(response.statusCode).toBe(200);
            expect(response.json()).toHaveProperty('message');
            expect(response.json()).toHaveProperty('role');
            expect(response.json().role).toBe('user');
        });
    });

    describe('PATCH /user/:id/ban', () => {
        it('should ban a user successfully', async () => {
            // ensureNotMaster
            vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
                id: 2,
                roleId: 1,
                role: { role: 'user' },
            } as any);

            // ensureUserExistById
            vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
                id: 2,
                name: 'User to Ban',
                email: 'banned@email.com',
                roleId: 1,
            } as any);

            // user.findUnique para pegar email atual
            vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
                id: 2,
                email: 'banned@email.com',
                activate: true,
            } as any);

            // user.update
            vi.mocked(prisma.user.update).mockResolvedValueOnce({
                id: 2,
                email: 'banned_2_banned@email.com',
                activate: false,
                deletedAt: new Date(),
            } as any);

            const response = await app.inject({
                method: 'PATCH',
                url: '/api/master/user/2/ban',
                headers: { authorization: 'Bearer mocked_token_12345' },
            });

            expect(response.statusCode).toBe(200);
            expect(response.json()).toHaveProperty('message');
            expect(response.json()).toHaveProperty('bannedAt');
        });
    });
});
