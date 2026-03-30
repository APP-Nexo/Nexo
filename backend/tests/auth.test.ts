import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { startApp, closeApp } from './tests.setup.js'
import { app } from '../src/conf.js'

// ============================================================
//  MOCKS
// ============================================================

vi.mock('../src/helpers/utils/prisma_conn.js', () => 
({
    default: {
        user: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn().mockResolvedValue({
            id: 1,
            name: 'Test User',
            email: 'test_vitest@email.com',
            createdAt: new Date(),
            roleId: 1
        })
        },
        role: {
            findUnique: vi.fn().mockResolvedValue({ id: 1, role: 'user' })
        }
    }
}))

// ============================================================
//  TESTS
// ============================================================

beforeAll(async () => await startApp())
afterAll(async () => await closeApp())

describe('Auth - Register', () => 
{
    it('should register a user successfully', async () => 
    {
        const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
            name: 'Test User',
            email: 'test_vitest@email.com',
            password: '12345',
            confirmPassword: '12345'
        }
        })

        expect(response.statusCode).toBe(201)
    })
})

