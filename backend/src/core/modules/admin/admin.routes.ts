import type { FastifyInstance } from 'fastify';
import { AdminController } from './admin.controller.js';

import { 
    getUsersSchemaSwagger, 
    getUsersStatsSchemaSwagger,
    getUsersAdminSchemaSwagger,
    searchUserAdminSchemaSwagger
} from './admin.swagger.js';

import { checkToken } from '../../shared/middlewares/check_token.js';
import { checkAccessPerm } from '../../shared/middlewares/check_acess_perm.js';

export async function adminRoutes(app: FastifyInstance) {
    app.get('/user/search', { ...searchUserAdminSchemaSwagger, preHandler: [checkToken, checkAccessPerm] }, AdminController.searchUser)
    app.get('/user/all', { ...getUsersSchemaSwagger, preHandler: [checkToken, checkAccessPerm] }, AdminController.getUsers)
    app.get('/user/admin', { ...getUsersAdminSchemaSwagger, preHandler: [checkToken, checkAccessPerm] }, AdminController.getUsersAdmin)
    app.get('/user/stats', { ...getUsersStatsSchemaSwagger, preHandler: [checkToken, checkAccessPerm] }, AdminController.getUsersStats)
}