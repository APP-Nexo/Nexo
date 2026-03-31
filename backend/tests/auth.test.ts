import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { startApp, closeApp } from './tests.setup.js'

// ================================================================
//  SETUP MOCKS - Must be declared before imports to ensure hoisting
// =================================================================
vi.mock('../src/helpers/utils/prisma_conn.js', () => ({
    default: {
        user: {
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            create: vi.fn(),
        },
        role: {
            findUnique: vi.fn(),
        }
    }
}))

vi.mock('../src/helpers/utils/encrypt_password.js', () => ({
    encryptPassword: vi.fn()
}))

vi.mock('../src/helpers/utils/compare_password.js', () => ({
    comparePassword: vi.fn()
}))

vi.mock('../src/helpers/utils/jwt_token.js', () => ({
    JwtToken: {
        create: vi.fn().mockResolvedValue('mocked_token_12345')
    }
}))

// ============================================================
//  IMPORTS - After mocks are hoisted
// ============================================================
import { app } from '../src/conf.js'
import prisma from '../src/helpers/utils/prisma_conn.js'
import { encryptPassword } from '../src/helpers/utils/encrypt_password.js'
import { comparePassword } from '../src/helpers/utils/compare_password.js'

// ============================================================
//  TESTS
// ============================================================
beforeAll(async () => await startApp())
afterAll(async () => await closeApp())

beforeEach(() => {
    vi.clearAllMocks()
})

describe('Auth Routes', () => {
    describe('POST /register', () => {
        it('should register a user successfully', async () => {
            vi.mocked(prisma.role.findUnique).mockResolvedValueOnce({ id: 1, role: 'user' } as any)
            vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)
            vi.mocked(encryptPassword).mockResolvedValueOnce('hashed_password')
            vi.mocked(prisma.user.create).mockResolvedValueOnce({
                id: 1,
                name: 'Test User',
                email: 'test@email.com',
                password: 'hashed_password',
                roleId: 1,
                createdAt: new Date(),
            } as any)

            const response = await app.inject({
                method: 'POST',
                url: '/api/auth/register',
                payload: {
                    name: 'Test User',
                    email: 'test@email.com',
                    password: 'password123',
                    confirmPassword: 'password123'
                }
            })

            expect(response.statusCode).toBe(201)
            expect(response.json()).toHaveProperty('token')
            expect(response.json()).toHaveProperty('tokenType')
            expect(response.json()).toHaveProperty('expiresIn')
        })
    })

    describe('POST /login', () => {
        it('should login a user successfully', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue({
                id: 1,
                name: 'Test User',
                email: 'test@email.com',
                password: 'hashed_password_hash',
                roleId: 1,
                createdAt: new Date(),
            } as any)

            vi.mocked(comparePassword).mockResolvedValue(true)

            const response = await app.inject({
                method: 'POST',
                url: '/api/auth/login',
                payload: {
                    email: 'test@email.com',
                    password: 'password123'
                }
            })

            expect(response.statusCode).toBe(200)
            expect(response.json()).toHaveProperty('token')
            expect(response.json()).toHaveProperty('tokenType')
            expect(response.json()).toHaveProperty('expiresIn')
        })
    })
})

