import type { FastifyInstance } from 'fastify';
import { checkToken } from '../../shared/middlewares/check_token.js';
import { UserController } from './user.controller.js';
import {
    deleteUserSchemaSwagger,
    getFollowersSchemaSwagger,
    getFollowingsSchemaSwagger,
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

    app.get(
        '/:id/followers',
        { ...getFollowersSchemaSwagger, preHandler: [checkToken] },
        UserController.getFollowers,
    );

    app.get(
        '/:id/followings',
        { ...getFollowingsSchemaSwagger, preHandler: [checkToken] },
        UserController.getFollowings,
    );
}
