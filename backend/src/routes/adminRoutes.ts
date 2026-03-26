import type { FastifyInstance } from 'fastify';
import { AdminController } from '../controllers/AdminController.js';

import { checkToken } from '../middlewares/check_token.js';
import { checkAccess } from '../middlewares/check_acess.js';

export async function adminRoutes(app: FastifyInstance) 
{
    app.get('/user/search', { preHandler: [checkToken, checkAccess] }, AdminController.searchUser)
    app.get('/user/all', { preHandler: [checkToken, checkAccess] }, AdminController.getUsers)
    app.get('/user/admin', { preHandler: [checkToken, checkAccess] }, AdminController.getUsersAdmin)
    app.get('/user/stats', { preHandler: [checkToken, checkAccess] }, AdminController.getUsersStats)
}