import type { FastifyInstance } from 'fastify';
import { UserController } from '../controllers/UserController.js';

import { checkToken } from '../middlewares/check_token.js';
import { checkUser } from '../middlewares/check_user.js';

export async function userRoutes(app: FastifyInstance) 
{
    app.patch('/update', { preHandler: [checkToken, checkUser] }, UserController.update)

    app.get('/search', { preHandler: [checkToken] }, UserController.searchUser)
    app.get('/:id', { preHandler: [checkToken] }, UserController.getUser)

    app.delete('/delete/:id', { preHandler: [checkToken, checkUser] }, UserController.delete)
}