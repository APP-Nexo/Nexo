import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { closeApp, startApp } from './tests.setup.js';

vi.mock('../shared/utils/prisma/prisma_conn.js', () => ({
    default: {
        user: { findMany: vi.fn() },
    },
}));

import { app } from '../conf.js';
import prisma from '../shared/utils/prisma/prisma_conn.js';

beforeAll(async () => await startApp());
afterAll(async () => await closeApp());

describe('Search Routes', () => {
    describe('GET /search/users', () => {
        it('should search users by name', async () => {
            vi.mocked(prisma.user.findMany).mockResolvedValueOnce([
                {
                    id: 1,
                    name: 'Test User',
                    username: 'testuser',
                    profile: { photo: null, bio: 'hi', followersCount: 5 },
                },
            ] as any);

            const response = await app.inject({
                method: 'GET',
                url: '/api/search/users?q=test',
            });

            expect(response.statusCode).toBe(200);
            const body = response.json();
            expect(body).toHaveProperty('data');
            expect(body.data).toHaveLength(1);
            expect(body.data[0]).toHaveProperty('name', 'Test User');
            expect(body.data[0]).toHaveProperty('username', 'testuser');
        });

        it('should return empty array for short query', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/search/users?q=a',
            });

            expect(response.statusCode).toBe(200);
            expect(response.json().data).toEqual([]);
        });
    });
});
