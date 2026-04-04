import type { FastifyInstance } from 'fastify';
import { checkToken } from '../../shared/middlewares/check_token.js';
import { FollowController } from './follow.controller.js';

import { followUserSchemaSwagger, unfollowUserSchemaSwagger } from './follow.swagger.js';

export async function followRoutes(app: FastifyInstance) {
    app.post(
        '/user/:id/follow',
        { ...followUserSchemaSwagger, preHandler: [checkToken] },
        FollowController.followUser,
    );

    app.delete(
        '/user/:id/unfollow',
        { ...unfollowUserSchemaSwagger, preHandler: [checkToken] },
        FollowController.unfollowUser,
    );
}
