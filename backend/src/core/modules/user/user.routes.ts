import type { FastifyInstance } from 'fastify';
import { checkToken } from '../../shared/middlewares/check_token.js';
import { UserController } from './user.controller.js';
import {
    deleteUserSchemaSwagger,
    getUserSchemaSwagger,
    searchUserSchemaSwagger,
} from './user.swagger.js';

export async function userRoutes(app: FastifyInstance) {
    app.get(
        '/search',
        { ...searchUserSchemaSwagger, preHandler: [checkToken] },
        UserController.searchUser,
    );
    app.get('/:id', { ...getUserSchemaSwagger, preHandler: [checkToken] }, UserController.getUser);

    app.patch(
        '/delete',
        { ...deleteUserSchemaSwagger, preHandler: [checkToken] },
        UserController.delete,
    );

    // GET /api/user/:id/followers
    app.get('/followers', { preHandler: [checkToken] }, UserController.getFollowers);

    // GET /api/user/:id/followings
    app.get('/followings', { preHandler: [checkToken] }, UserController.getFollowings);
}
