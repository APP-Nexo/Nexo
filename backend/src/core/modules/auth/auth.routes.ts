import type { FastifyInstance } from 'fastify';
import { AuthController } from './auth.controller.js';

import { registerSchemaSwagger, loginSchemaSwagger } from './auth.swagger.js';

export async function authRoutes(app: FastifyInstance) 
{
    app.post('/register', registerSchemaSwagger, AuthController.register)
    app.post('/login', loginSchemaSwagger, AuthController.login)
}