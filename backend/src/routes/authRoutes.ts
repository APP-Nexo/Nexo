import type { FastifyInstance } from 'fastify';
import { AuthController } from '../controllers/AuthController.js';

export async function healthRoutes(app: FastifyInstance) 
{
    app.post('/login', AuthController.login)
    app.get('/register', AuthController.register)
}