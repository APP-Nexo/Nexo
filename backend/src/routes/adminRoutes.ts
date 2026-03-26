import type { FastifyInstance } from 'fastify';
import { AdminController } from '../controllers/AdminController.js';

import { checkToken } from '../middlewares/check_token.js';
import { checkAccessPerm } from '../middlewares/check_acess_perm.js';

export async function adminRoutes(app: FastifyInstance) 
{
    app.get('/user/search', { preHandler: [checkToken, checkAccessPerm] }, AdminController.searchUser)
    app.get('/user/all', { preHandler: [checkToken, checkAccessPerm] }, AdminController.getUsers)
    app.get('/user/admin', { preHandler: [checkToken, checkAccessPerm] }, AdminController.getUsersAdmin)
    app.get('/user/stats', { preHandler: [checkToken, checkAccessPerm] }, AdminController.getUsersStats)
}