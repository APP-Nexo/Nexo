import type { FastifyInstance } from 'fastify';
import { checkToken } from '../../shared/middlewares/check_token.js';
import { UsersController } from './users.controller.js';
import {
    getUserListsSchemaSwagger,
    getUserProfileSchemaSwagger,
    getUserReviewsSchemaSwagger,
    getUserStatsSchemaSwagger,
} from './users.swagger.js';

export async function usersRoutes(app: FastifyInstance) {
    app.get(
        '/:username',
        { ...getUserProfileSchemaSwagger, preHandler: [checkToken] },
        UsersController.getProfile,
    );
    app.get(
        '/:username/reviews',
        { ...getUserReviewsSchemaSwagger, preHandler: [checkToken] },
        UsersController.getReviews,
    );
    app.get('/:username/stats', { ...getUserStatsSchemaSwagger }, UsersController.getStats);
    app.get(
        '/:username/lists',
        { ...getUserListsSchemaSwagger, preHandler: [checkToken] },
        UsersController.getLists,
    );
}
