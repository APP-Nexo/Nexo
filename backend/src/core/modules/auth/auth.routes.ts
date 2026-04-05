import type { FastifyInstance } from 'fastify';
import { AuthController } from './auth.controller.js';
import { loginSchemaSwagger, refreshSchemaSwagger, registerSchemaSwagger } from './auth.swagger.js';

export async function authRoutes(app: FastifyInstance) {
    app.post(
        '/register',
        {
            ...registerSchemaSwagger,
            config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
        },
        AuthController.register,
    );
    app.post(
        '/login',
        {
            ...loginSchemaSwagger,
            config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
        },
        AuthController.login,
    );
    app.post(
        '/refresh',
        {
            ...refreshSchemaSwagger,
            config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
        },
        AuthController.refresh,
    );
}
