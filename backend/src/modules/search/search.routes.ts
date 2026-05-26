import type { FastifyInstance } from 'fastify';
import { SearchController } from './search.controller.js';
import { searchUsersSchemaSwagger } from './search.swagger.js';

export async function searchRoutes(app: FastifyInstance) {
    app.get('/users', { ...searchUsersSchemaSwagger }, SearchController.searchUsers);
}
