import 'dotenv/config';

import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import swaggerUi from '@fastify/swagger-ui';
import type { FastifyRequest } from 'fastify';
import fastify from 'fastify';
import fs from 'fs';
import { setupSwagger } from '../swagger.config.js';
import { errorHandler } from './shared/errors/error_handler.js';

export const app = fastify({
    logger: process.env.NODE_ENV !== 'test' ? { transport: { target: 'pino-pretty' } } : false,
    trustProxy: true,
    https: {
        key: fs.readFileSync('./certs/key.pem'),
        cert: fs.readFileSync('./certs/cert.pem'),
    },
});

await setupSwagger(app);
await app.register(cors);
app.setErrorHandler(errorHandler);
await app.register(fastifyJwt, { secret: process.env.SECRET! });

await app.register(rateLimit, {
    global: true,
    max: 40,
    timeWindow: '1 minute',
    keyGenerator: (req: FastifyRequest) => req.ip,
    errorResponseBuilder: () => ({
        statusCode: 429,
        message: 'Muitas requisições. Tente novamente em instantes.',
    }),
});

import { adminRoutes } from './modules/admin/admin.routes.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { followRoutes } from './modules/follow/follow.routes.js';
import { healthRoutes } from './modules/health/health.routes.js';
import { masterRoutes } from './modules/master/master.routes.js';
import { notificationRoutes } from './modules/notification/notification.routes.js';
import { userRoutes } from './modules/user/user.routes.js';

const routes = [
    { route: healthRoutes, prefix: 'api/verify' },
    { route: authRoutes, prefix: 'api/auth' },
    { route: userRoutes, prefix: 'api/user' },
    { route: masterRoutes, prefix: 'api/master' },
    { route: adminRoutes, prefix: 'api/admin' },
    { route: followRoutes, prefix: 'api/user' },
    { route: notificationRoutes, prefix: 'api/notification' },
];

routes.map(({ route, prefix }) => app.register(route, { prefix }));
