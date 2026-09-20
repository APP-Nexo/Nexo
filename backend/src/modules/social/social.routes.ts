import type { FastifyInstance } from 'fastify';
import { checkToken } from '../../shared/middlewares/check_token.js';
import { SocialController } from './social.controller.js';
import {
    followUserSchemaSwagger,
    getFeedSchemaSwagger,
    getFollowersSchemaSwagger,
    getFollowingSchemaSwagger,
    removeFollowerSchemaSwagger,
    unfollowUserSchemaSwagger,
} from './social.swagger.js';

export async function socialRoutes(app: FastifyInstance) {
    app.post(
        '/:username/follow',
        { ...followUserSchemaSwagger, preHandler: [checkToken] },
        SocialController.followUser,
    );
    app.delete(
        '/:username/follow',
        { ...unfollowUserSchemaSwagger, preHandler: [checkToken] },
        SocialController.unfollowUser,
    );
    app.get(
        '/:username/followers',
        { ...getFollowersSchemaSwagger, preHandler: [checkToken] },
        SocialController.getFollowers,
    );
    app.delete(
        '/:username/followers',
        { ...removeFollowerSchemaSwagger, preHandler: [checkToken] },
        SocialController.removeFollower,
    );
    app.get(
        '/:username/following',
        { ...getFollowingSchemaSwagger, preHandler: [checkToken] },
        SocialController.getFollowing,
    );
    app.get(
        '/feed',
        { ...getFeedSchemaSwagger, preHandler: [checkToken] },
        SocialController.getFeed,
    );
}
