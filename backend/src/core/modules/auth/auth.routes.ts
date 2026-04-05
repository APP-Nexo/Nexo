import type { FastifyInstance } from 'fastify';
import { AuthController } from './auth.controller.js';

import { loginSchemaSwagger, registerSchemaSwagger } from './auth.swagger.js';

export async function authRoutes(app: FastifyInstance) {
    app.post('/register', {
        ...registerSchemaSwagger,
        config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
    }, AuthController.register);

    app.post('/login', {
        ...loginSchemaSwagger,
        config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
    }, AuthController.login);
}