import type { FastifyInstance } from 'fastify';
import { AdminController } from '../controllers/AdminController.js';

import { 
    getUsersSchemaSwagger, 
    getUsersStatsSchemaSwagger,
    getUsersAdminSchemaSwagger,
    searchUserAdminSchemaSwagger
} from '../../documentation/admin.docs.js';

import { checkToken } from '../middlewares/check_token.js';
import { checkAccessPerm } from '../middlewares/check_acess_perm.js';

export async function adminRoutes(app: FastifyInstance) {
    app.get('/user/search', { ...searchUserAdminSchemaSwagger, preHandler: [checkToken, checkAccessPerm] }, AdminController.searchUser)
    app.get('/user/all', { ...getUsersSchemaSwagger, preHandler: [checkToken, checkAccessPerm] }, AdminController.getUsers)
    app.get('/user/admin', { ...getUsersAdminSchemaSwagger, preHandler: [checkToken, checkAccessPerm] }, AdminController.getUsersAdmin)
    app.get('/user/stats', { ...getUsersStatsSchemaSwagger, preHandler: [checkToken, checkAccessPerm] }, AdminController.getUsersStats)
}