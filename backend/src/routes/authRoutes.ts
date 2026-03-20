import type { FastifyInstance } from 'fastify';
import { AuthController } from '../controllers/AuthController.js';

export async function authRoutes(app: FastifyInstance) 
{
    app.post('/register', AuthController.register)
    app.post('/login', AuthController.login)
}