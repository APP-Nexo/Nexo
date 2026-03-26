import type { FastifyInstance } from 'fastify';
import { AdminController } from '../controllers/AdminController.js';

import { checkToken } from '../middlewares/check_token.js';
import { checkAccess } from '../middlewares/check_acess.js';
import { checkAccessMaster } from '../middlewares/check_acess_master.js';

export async function adminRoutes(app: FastifyInstance) 
{
    app.patch('/user/:id/promote', { preHandler: [checkToken, checkAccessMaster] }, AdminController.promoteUser)
    app.patch('/user/:id/demote', { preHandler: [checkToken, checkAccessMaster] }, AdminController.demoteUser)
    app.patch('/user/:id/ban', { preHandler: [checkToken, checkAccessMaster] }, AdminController.banUser)

    app.get('/user/search', { preHandler: [checkToken, checkAccess] }, AdminController.searchUser)
    app.get('/user/all', { preHandler: [checkToken, checkAccess] }, AdminController.getUsers)
    app.get('/user/admin', { preHandler: [checkToken, checkAccess] }, AdminController.getUsersAdmin)
    app.get('/user/stats', { preHandler: [checkToken, checkAccess] }, AdminController.getUsersStats)
}