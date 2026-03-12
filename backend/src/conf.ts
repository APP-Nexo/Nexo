import fastify from "fastify";
import cors from "@fastify/cors";

import { healthRoutes } from "./routes/healthRoutes.js";

export const app = fastify({ 
    logger: { transport: { target: 'pino-pretty' } }
});

await app.register(cors);

const routes = [
    { route: healthRoutes, prefix: 'api/verify' },
];

routes.forEach(({ route, prefix }) => app.register(route, { prefix }));