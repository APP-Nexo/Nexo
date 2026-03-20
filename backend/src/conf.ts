import 'dotenv/config'

import fastify from "fastify";
import cors from "@fastify/cors";

import { healthRoutes } from "./routes/healthRoutes.js";
import { authRoutes } from "./routes/authRoutes.js";

import { errorHandler } from "./middlewares/error_handler.js";
import fastifyJwt from "@fastify/jwt";

export const app = fastify({ 
    logger: { transport: { target: 'pino-pretty' } }
});

await app.register(cors);
app.setErrorHandler(errorHandler);
await app.register(fastifyJwt, { secret: process.env.SECRET! });

const routes = [
    { route: healthRoutes, prefix: 'api/verify' },
    { route: authRoutes, prefix: 'api/auth' },
];

routes.forEach(({ route, prefix }) => app.register(route, { prefix }));