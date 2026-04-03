import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { startApp, closeApp } from './tests.setup.js'
import { app } from '../../src/core/conf.js'

// ============================================================
//  TESTS
// ============================================================
beforeAll(async () => await startApp())
afterAll(async () => await closeApp())

describe('Health - health', () => 
{
    it('should return healthy status', async () => {
        const response = await app.inject({
        method: 'GET',
        url: '/api/verify/health',
        })

        expect(response.statusCode).toBe(200)
        const body = response.json()
        expect(body).toHaveProperty('message', 'healthy')
        expect(body).toHaveProperty('uptime')
    })
})

describe('Health - ping', () => 
{
    it('should return pong', async () => {
        const response = await app.inject({
        method: 'GET',
        url: '/api/verify/ping',
        })

        expect(response.statusCode).toBe(200)
        const body = response.json()
        expect(body).toHaveProperty('message', 'pong')
        expect(body).toHaveProperty('timestamp')
    })
})