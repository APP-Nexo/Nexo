import type { FastifyInstance } from 'fastify';
import { FollowController } from '../controllers/FollowController.js';

import { checkToken } from '../middlewares/check_token.js';

export async function followRoutes(app: FastifyInstance) 
{
    app.post('/user/:id/follow', { preHandler: [checkToken] }, FollowController.followUser)

    app.delete('/user/:id/unfollow', { preHandler: [checkToken] }, FollowController.unfollowUser)
}