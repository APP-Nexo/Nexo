import type { FastifyInstance } from 'fastify';
import { FollowController } from '../controllers/FollowController.js';

import { checkToken } from '../middlewares/check_token.js';

import { followUserSchemaSwagger, unfollowUserSchemaSwagger } from '../../documentation/follow.swagger.js';

export async function followRoutes(app: FastifyInstance) 
{
    app.post('/user/:id/follow',     { ... followUserSchemaSwagger, preHandler: [checkToken] },  FollowController.followUser)

    app.delete('/user/:id/unfollow', { ...unfollowUserSchemaSwagger, preHandler: [checkToken] }, FollowController.unfollowUser)
}