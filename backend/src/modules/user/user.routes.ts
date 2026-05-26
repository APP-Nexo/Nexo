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
        {
            ...searchUserSchemaSwagger,
            preHandler: [checkToken],
            config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
        },
        UserController.searchUser,
    );

    app.get(
        '/:id',
        {
            ...getUserSchemaSwagger,
            preHandler: [checkToken],
            config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
        },
        UserController.getUser,
    );

    app.patch(
        '/delete',
        {
            ...deleteUserSchemaSwagger,
            preHandler: [checkToken],
            config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
        },
        UserController.delete,
    );

    app.get(
        '/:id/followers',
        {
            ...getFollowersSchemaSwagger,
            preHandler: [checkToken],
            config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
        },
        UserController.getFollowers,
    );

    app.get(
        '/:id/followings',
        {
            ...getFollowingsSchemaSwagger,
            preHandler: [checkToken],
            config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
        },
        UserController.getFollowings,
    );
}
