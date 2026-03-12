import type { FastifyInstance } from 'fastify';
import { HealthController } from '../controllers/HealthController.js';

export async function healthRoutes(app: FastifyInstance) 
{
  app.get('/health', HealthController.health)
  app.get('/ping', HealthController.ping)
}