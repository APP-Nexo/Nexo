import 'dotenv/config'

import fastify from "fastify";
import swaggerUi from '@fastify/swagger-ui'
import { setupSwagger } from '../documentation/swagger.setup.js';
import cors from "@fastify/cors";

import { errorHandler } from "./middlewares/error_handler.js";
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

import { healthRoutes } from "./routes/healthRoutes.js";
import { authRoutes } from "./routes/authRoutes.js";
import { userRoutes } from './routes/userRoutes.js';
import { adminRoutes } from './routes/adminRoutes.js';
import { masterRoutes } from './routes/masterRoutes.js';
import { followRoutes } from './routes/followRoutes.js';

const routes = [
    { route: healthRoutes, prefix: 'api/verify' },
    { route: authRoutes, prefix: 'api/auth' },
    { route: userRoutes, prefix: 'api/user' },
    { route: masterRoutes, prefix: 'api/master' },
    { route: adminRoutes, prefix: 'api/admin' },
    { route: followRoutes, prefix: 'api/follow' },
];

routes.forEach(({ route, prefix }) => app.register(route, { prefix }));