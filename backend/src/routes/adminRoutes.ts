import type { FastifyInstance } from 'fastify';
import { AdminController } from '../controllers/AdminController.js';

import { checkToken } from '../middlewares/check_token.js';
import { checkAcess } from '../middlewares/check_acess.js';

export async function adminRoutes(app: FastifyInstance) 
{
    app.get('/user/search', { preHandler: [checkToken, checkAcess] }, AdminController.searchUser)
    app.get('/user/all', { preHandler: [checkToken, checkAcess] }, AdminController.getUsers)
    app.get('/user/admin', { preHandler: [checkToken, checkAcess] }, AdminController.getUsersAdmin)
    app.get('/user/stats', { preHandler: [checkToken, checkAcess] }, AdminController.getUsersStats)
}