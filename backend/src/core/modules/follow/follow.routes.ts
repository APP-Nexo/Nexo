import type { FastifyInstance } from 'fastify';
import { FollowController } from './follow.controller.js';

import { checkToken } from '../../shared/middlewares/check_token.js';

import { followUserSchemaSwagger, unfollowUserSchemaSwagger } from './follow.swagger.js';

export async function followRoutes(app: FastifyInstance) 
{
    app.post('/user/:id/follow',     { ... followUserSchemaSwagger, preHandler: [checkToken] },  FollowController.followUser)

    app.delete('/user/:id/unfollow', { ...unfollowUserSchemaSwagger, preHandler: [checkToken] }, FollowController.unfollowUser)
}