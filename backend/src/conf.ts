import 'dotenv/config';

import fs from 'node:fs';
import path from 'node:path';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import staticFiles from '@fastify/static';
import type { FastifyRequest } from 'fastify';
import fastify from 'fastify';
import { setupSwagger } from '../swagger.config.js';
import { env } from './shared/config/env.js';
import { errorHandler } from './shared/errors/error_handler.js';

const https =
    env.tlsKeyPath && env.tlsCertPath
        ? {
              key: fs.readFileSync(env.tlsKeyPath),
              cert: fs.readFileSync(env.tlsCertPath),
          }
        : undefined;

export const app = fastify({
    logger: env.isTest ? false : env.isProduction ? true : { transport: { target: 'pino-pretty' } },
    trustProxy: env.trustProxy.length > 0 ? [...env.trustProxy] : false,
    ...(https ? { https } : {}),
});

await setupSwagger(app);
await app.register(cors, {
    origin(origin, callback) {
        if (!origin || (!env.isProduction && env.corsOrigins.length === 0)) {
            callback(null, true);
            return;
        }
        callback(null, env.corsOrigins.includes(origin));
    },
});
app.setErrorHandler(errorHandler);
await app.register(fastifyJwt, { secret: env.secret });

await app.register(multipart, {
    limits: { fileSize: 5 * 1024 * 1024, files: 2, fields: 2 },
});
await app.register(staticFiles, {
    root: path.join(process.cwd(), 'public'),
    prefix: '/uploads/',
    decorateReply: false,
    setHeaders(response) {
        response.header('X-Content-Type-Options', 'nosniff');
        response.header('Content-Security-Policy', "default-src 'none'");
    },
});

function isProfileUpload(req: FastifyRequest) {
    const pathname = req.url.split('?', 1)[0];
    const contentType = req.headers['content-type'];
    return (
        req.method === 'PUT' &&
        (pathname === '/api/me' || pathname === '/api/me/') &&
        typeof contentType === 'string' &&
        /^multipart\/form-data(?:;|$)/i.test(contentType)
    );
}

await app.register(rateLimit, {
    global: true,
    max: (req) => (isProfileUpload(req) ? 5 : 40),
    timeWindow: (req) => (isProfileUpload(req) ? 60 * 60 * 1000 : 60 * 1000),
    keyGenerator: (req: FastifyRequest) =>
        `${isProfileUpload(req) ? 'upload' : 'global'}:${req.ip}`,
    errorResponseBuilder: (req) => ({
        statusCode: 429,
        code: 'RATE_LIMITED',
        message: 'Muitas requisições. Tente novamente em instantes.',
        requestId: req.id,
    }),
});

import { adminRoutes } from './modules/admin/admin.routes.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { gamesRoutes, gamesSearchAliasRoutes } from './modules/games/games.routes.js';
import { healthRoutes } from './modules/health/health.routes.js';
import { libraryRoutes } from './modules/library/library.routes.js';
import { masterRoutes } from './modules/master/master.routes.js';
import { meRoutes } from './modules/me/me.routes.js';
import { notificationRoutes } from './modules/notification/notification.routes.js';
import { reviewsRoutes } from './modules/reviews/reviews.routes.js';
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
    { route: gamesSearchAliasRoutes, prefix: 'api/search' },
    { route: gamesRoutes, prefix: 'api/games' },
    { route: libraryRoutes, prefix: 'api/library' },
    { route: reviewsRoutes, prefix: 'api/reviews' },
    { route: masterRoutes, prefix: 'api/master' },
    { route: adminRoutes, prefix: 'api/admin' },
    { route: notificationRoutes, prefix: 'api/notification' },
];

routes.map(({ route, prefix }) => app.register(route, { prefix }));
