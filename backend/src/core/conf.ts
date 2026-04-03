import 'dotenv/config'

import fastify from "fastify";
import swaggerUi from '@fastify/swagger-ui'
import { setupSwagger } from '../../swagger.config.js';
import cors from "@fastify/cors";

import { errorHandler } from './shared/middlewares/error_handler.js';
import fastifyJwt from "@fastify/jwt";

export const app = fastify({ 
    logger: process.env.NODE_ENV !== 'test' 
    ? { transport: { target: 'pino-pretty' } } 
    : false
});

await setupSwagger(app)
await app.register(cors);
app.setErrorHandler(errorHandler);
await app.register(fastifyJwt, { secret: process.env.SECRET! });

import { healthRoutes } from "./modules/health/health.routes.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { userRoutes } from './modules/user/user.routes.js';
import { adminRoutes } from './modules/admin/admin.routes.js';
import { masterRoutes } from './modules/master/master.routes.js';
import { followRoutes } from './modules/follow/follow.routes.js';
import { notificationRoutes } from './modules/notification/notification.routes.js';

const routes = [
    { route: healthRoutes, prefix: 'api/verify' },
    { route: authRoutes, prefix: 'api/auth' },
    { route: userRoutes, prefix: 'api/user' },
    { route: masterRoutes, prefix: 'api/master' },
    { route: adminRoutes, prefix: 'api/admin' },
    { route: followRoutes, prefix: 'api/' },
    { route: notificationRoutes, prefix: 'api/notification' },
];

routes.forEach(({ route, prefix }) => app.register(route, { prefix }));