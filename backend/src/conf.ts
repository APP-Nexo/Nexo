import 'dotenv/config';

import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import staticFiles from '@fastify/static';
import swaggerUi from '@fastify/swagger-ui';
import type { FastifyRequest } from 'fastify';
import fastify from 'fastify';
import fs from 'fs';
import path from 'path';
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

await app.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } });
await app.register(staticFiles, {
    root: path.join(process.cwd(), 'public'),
    prefix: '/uploads/',
    decorateReply: false,
});

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
import { healthRoutes } from './modules/health/health.routes.js';
import { masterRoutes } from './modules/master/master.routes.js';
import { meRoutes } from './modules/me/me.routes.js';
import { notificationRoutes } from './modules/notification/notification.routes.js';
import { searchRoutes } from './modules/search/search.routes.js';
import { socialRoutes } from './modules/social/social.routes.js';
import { usersRoutes } from './modules/users/users.routes.js';

const routes = [
    { route: healthRoutes, prefix: 'api/verify' },
    { route: authRoutes, prefix: 'api/auth' },
    { route: meRoutes, prefix: 'api/me' },
    { route: usersRoutes, prefix: 'api/users' },
    { route: socialRoutes, prefix: 'api/social' },
    { route: searchRoutes, prefix: 'api/search' },
    { route: masterRoutes, prefix: 'api/master' },
    { route: adminRoutes, prefix: 'api/admin' },
    { route: notificationRoutes, prefix: 'api/notification' },
];

routes.map(({ route, prefix }) => app.register(route, { prefix }));
