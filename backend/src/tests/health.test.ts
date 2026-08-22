import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { app } from '../conf.js';
import prisma from '../shared/utils/prisma/prisma_conn.js';
import { closeApp, startApp } from './tests.setup.js';

// ============================================================
//  TESTS
// ============================================================
beforeAll(async () => await startApp());
afterAll(async () => await closeApp());

describe('Health - health', () => {
    it('should return healthy status', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/api/verify/health',
        });

        expect(response.statusCode).toBe(200);
        const body = response.json();
        expect(body).toHaveProperty('message', 'healthy');
        expect(body).toHaveProperty('uptime');
    });
});

describe('Health - ping', () => {
    it('should return pong', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/api/verify/ping',
        });

        expect(response.statusCode).toBe(200);
        const body = response.json();
        expect(body).toHaveProperty('message', 'pong');
        expect(body).toHaveProperty('timestamp');
    });
});

describe('Health - ready', () => {
    it('returns ready when PostgreSQL responds', async () => {
        vi.spyOn(prisma, '$queryRaw').mockResolvedValueOnce([{ result: 1 }]);

        const response = await app.inject({ method: 'GET', url: '/api/verify/ready' });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toMatchObject({ message: 'ready', database: 'reachable' });
    });

    it('returns 503 without leaking the database error', async () => {
        vi.spyOn(prisma, '$queryRaw').mockRejectedValueOnce(new Error('connection string details'));

        const response = await app.inject({ method: 'GET', url: '/api/verify/ready' });

        expect(response.statusCode).toBe(503);
        expect(response.json()).toMatchObject({
            code: 'AppError',
            message: 'Banco de dados indisponível.',
        });
        expect(response.body).not.toContain('connection string details');
    });
});
