import type { FastifyInstance } from 'fastify';
import { AuthController } from '../controllers/AuthController.js';

import { registerSchemaSwagger, loginSchemaSwagger } from '../../documentation/auth.docs.js';

export async function authRoutes(app: FastifyInstance) 
{
    app.post('/register', registerSchemaSwagger, AuthController.register)
    app.post('/login', loginSchemaSwagger, AuthController.login)
}