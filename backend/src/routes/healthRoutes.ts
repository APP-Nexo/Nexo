import type { FastifyInstance } from 'fastify';
import { HealthController } from '../controllers/HealthController.js';

import { healthSchemaSwagger, pingSchemaSwagger } from '../../documentation/health.docs.js';

export async function healthRoutes(app: FastifyInstance) 
{
    app.get('/health', healthSchemaSwagger, HealthController.health)
    app.get('/ping', pingSchemaSwagger, HealthController.ping)
}