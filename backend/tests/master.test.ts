import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { startApp, closeApp } from './tests.setup.js'

// ================================================================
//  SETUP MOCKS - Must be declared before imports to ensure hoisting
// =================================================================
vi.mock('../src/helpers/utils/prisma_conn.js', () => ({
    default: {
        user: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        role: {
            findUnique: vi.fn(),
        },
        vwUserPublic: {
            findUnique: vi.fn(),
        }
    }
}))

vi.mock('../src/middlewares/check_token.js', () => ({
    checkToken: async (req: any, reply: any) => {
        req.user = { id: 1, name: 'Master User', email: 'master@email.com', roleId: 3 }
    }
}))

vi.mock('../src/middlewares/check_acess_master.js', () => ({
    checkAccessMaster: async (req: any, reply: any) => {}
}))

// ============================================================
//  IMPORTS - After mocks are hoisted
// ============================================================
import { app } from '../src/conf.js'
import prisma from '../src/helpers/utils/prisma_conn.js'

// ============================================================
//  TESTS
// ============================================================
beforeAll(async () => await startApp())
afterAll(async () => await closeApp())

beforeEach(() => {
    vi.clearAllMocks()
})

describe('Master Routes', () => {
    describe('PATCH /user/:id/promote', () => {
        it('should promote a user to admin successfully', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
                id: 2,
                name: 'User to Promote',
                email: 'user@email.com',
                roleId: 1,
            } as any)

            vi.mocked(prisma.vwUserPublic.findUnique).mockResolvedValueOnce({
                id: 2,
                name: 'User to Promote',
                email: 'user@email.com',
            } as any)

            vi.mocked(prisma.role.findUnique).mockResolvedValueOnce({
                id: 2,
                role: 'admin'
            } as any)

            vi.mocked(prisma.user.update).mockResolvedValueOnce({
                id: 2,
                roleId: 2,
            } as any)

            const response = await app.inject({
                method: 'PATCH',
                url: '/api/master/user/2/promote',
                headers: {
                    authorization: 'Bearer mocked_token_12345'
                }
            })

            expect(response.statusCode).toBe(200)
            expect(response.json()).toHaveProperty('message')
            expect(response.json()).toHaveProperty('role')
            expect(response.json().role).toBe('admin')
        })
    })

    describe('PATCH /user/:id/demote', () => {
        it('should demote a user to user role successfully', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
                id: 2,
                name: 'Admin to Demote',
                email: 'admin@email.com',
                roleId: 2,
            } as any)

            vi.mocked(prisma.vwUserPublic.findUnique).mockResolvedValueOnce({
                id: 2,
                name: 'Admin to Demote',
                email: 'admin@email.com',
            } as any)

            vi.mocked(prisma.role.findUnique).mockResolvedValueOnce({
                id: 1,
                role: 'user'
            } as any)

            vi.mocked(prisma.user.update).mockResolvedValueOnce({
                id: 2,
                roleId: 1,
            } as any)

            const response = await app.inject({
                method: 'PATCH',
                url: '/api/master/user/2/demote',
                headers: {
                    authorization: 'Bearer mocked_token_12345'
                }
            })

            expect(response.statusCode).toBe(200)
            expect(response.json()).toHaveProperty('message')
            expect(response.json()).toHaveProperty('role')
            expect(response.json().role).toBe('user')
        })
    })

    describe('PATCH /user/:id/ban', () => {
        it('should ban a user successfully', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
                id: 2,
                name: 'User to Ban',
                email: 'banned@email.com',
                roleId: 1,
                activate: true,
            } as any)

            vi.mocked(prisma.vwUserPublic.findUnique).mockResolvedValueOnce({
                id: 2,
                name: 'User to Ban',
                email: 'banned@email.com',
            } as any)

            vi.mocked(prisma.user.update).mockResolvedValueOnce({
                id: 2,
                email: 'banned_2_banned@email.com',
                activate: false,
                deletedAt: new Date(),
            } as any)

            const response = await app.inject({
                method: 'PATCH',
                url: '/api/master/user/2/ban',
                headers: {
                    authorization: 'Bearer mocked_token_12345'
                }
            })

            expect(response.statusCode).toBe(200)
            expect(response.json()).toHaveProperty('message')
            expect(response.json()).toHaveProperty('bannedAt')
        })
    })
})
