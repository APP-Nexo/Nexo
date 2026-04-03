import type { FastifyInstance } from 'fastify';
import { HealthController } from './health.controller.js';

import { healthSchemaSwagger, pingSchemaSwagger } from './health.swagger.js';

export async function healthRoutes(app: FastifyInstance) 
{
    app.get('/health', healthSchemaSwagger, HealthController.health)
    app.get('/ping', pingSchemaSwagger, HealthController.ping)
}