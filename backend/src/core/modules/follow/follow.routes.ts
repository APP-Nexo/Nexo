import type { FastifyInstance } from 'fastify';
import { checkToken } from '../../shared/middlewares/check_token.js';
import { FollowController } from './follow.controller.js';

import { followUserSchemaSwagger, unfollowUserSchemaSwagger } from './follow.swagger.js';

export async function followRoutes(app: FastifyInstance) {
    app.post('/:id/follow', {
        ...followUserSchemaSwagger,
        preHandler: [checkToken],
        config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
    }, FollowController.followUser);

    app.delete('/:id/unfollow', {
        ...unfollowUserSchemaSwagger,
        preHandler: [checkToken],
        config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
    }, FollowController.unfollowUser);
}
