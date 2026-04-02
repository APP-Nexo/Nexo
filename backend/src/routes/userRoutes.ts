import type { FastifyInstance } from 'fastify';
import { UserController } from '../controllers/UserController.js';

import { 
    updateUserSchemaSwagger,
    searchUserSchemaSwagger, 
    getUserSchemaSwagger, 
    deleteUserSchemaSwagger
} from '../../documentation/user.swagger.js';

import { checkToken } from '../middlewares/check_token.js';
import { checkUser } from '../middlewares/check_user.js';

export async function userRoutes(app: FastifyInstance) 
{
    app.patch('/update', { ...updateUserSchemaSwagger, preHandler: [checkToken, checkUser] }, UserController.update) // develop

    app.get('/search', { ...searchUserSchemaSwagger, preHandler: [checkToken] }, UserController.searchUser)
    app.get('/:id', { ...getUserSchemaSwagger, preHandler: [checkToken] }, UserController.getUser)

    app.patch('/delete/:id', { ...deleteUserSchemaSwagger, preHandler: [checkToken, checkUser] }, UserController.delete)
}